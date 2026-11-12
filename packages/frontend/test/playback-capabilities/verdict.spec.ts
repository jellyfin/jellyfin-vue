import { describe, expect, test } from 'vitest';
import type { MediaSourceInfo, MediaStream } from '@jellyfin/sdk/lib/generated-client';
import {
  audioStream,
  mediaSource,
  probedAudio,
  probedVideo,
  probeOk,
  RENDERERS,
  subtitleStream,
  videoStream
} from './fixtures.ts';
import type { CapabilityAnswer, CapabilityOracle } from '#/utils/playback-capabilities/oracle.ts';
import type { ProbeResult } from '#/utils/playback-capabilities/probe.ts';
import {
  computeVerdict,
  getNextFloor,
  type PlaybackMethod,
  type Verdict,
  type VerdictEnvironment,
  type VerdictInput
} from '#/utils/playback-capabilities/verdict.ts';

/**
 * Content types the specs use
 */
const T = {
  h264Mp4: 'video/mp4; codecs="avc1.64001e"',
  h264Mkv: 'video/x-matroska; codecs="avc1.64001e"',
  aacMp4: 'audio/mp4; codecs="mp4a.40.2"',
  aacMkv: 'audio/x-matroska; codecs="mp4a.40.2"',
  ac3Mkv: 'audio/x-matroska; codecs="ac-3"',
  ac3Mp4: 'audio/mp4; codecs="ac-3"',
  opusMkv: 'audio/x-matroska; codecs="opus"',
  opusMp4: 'audio/mp4; codecs="opus"',
  hevcMkvHvc1: 'video/x-matroska; codecs="hvc1.2.4.L93.B0"',
  hevcMkvHev1: 'video/x-matroska; codecs="hev1.2.4.L93.B0"',
  hevcMp4Hvc1: 'video/mp4; codecs="hvc1.2.4.L93.B0"',
  hevcMp4Hev1: 'video/mp4; codecs="hev1.2.4.L93.B0"',
  mp3: 'audio/mpeg; codecs="mp3"',
  mp3Mp4: 'audio/mp4; codecs="mp3"',
  flac: 'audio/flac; codecs="flac"',
  flacMp4: 'audio/mp4; codecs="flac"',
  h264Target: 'video/mp4; codecs="avc1.640028"',
  av1Target: 'video/mp4; codecs="av01.0.08M.08"',
  vp9Target: 'video/mp4; codecs="vp09.00.40.08"',
  aacTarget: 'audio/mp4; codecs="mp4a.40.2"',
  opusTarget: 'audio/mp4; codecs="opus"'
};

interface FakeBrowser {
  file?: string[];
  ms?: string[];
  notSmooth?: string[];
  /**
   * Highest channel count accepted per content type (unlimited if absent)
   */
  maxChannels?: Record<string, number>;
}

/**
 * The oracle the verdict receives: answers from a description of a browser, and records every question
 */
function fakeOracle(browser: FakeBrowser): CapabilityOracle & { asked: MediaDecodingConfiguration[] } {
  const asked: MediaDecodingConfiguration[] = [];

  return {
    asked,
    clear: () => {
      // Nothing to forget
    },
    query: (config): Promise<CapabilityAnswer> => {
      asked.push(config);

      const contentType = config.video?.contentType ?? config.audio?.contentType ?? '';
      const list = config.type === 'file' ? browser.file : browser.ms;
      const channels = Number(config.audio?.channels ?? 0);
      const maxChannels = browser.maxChannels?.[contentType] ?? Infinity;
      const supported = (list ?? []).includes(contentType) && channels <= maxChannels;

      return Promise.resolve({ supported, smooth: supported && !browser.notSmooth?.includes(contentType), powerEfficient: supported });
    }
  };
}

/**
 * A modern browser with proprietary codecs: H.264 and AAC everywhere, MP4 and Matroska files
 */
const fullBrowser: FakeBrowser = {
  file: [T.h264Mp4, T.aacMp4, T.h264Mkv, T.aacMkv, T.opusMkv, T.mp3, T.flac],
  ms: [T.h264Mp4, T.aacMp4, T.opusMp4, T.mp3Mp4, T.flacMp4, T.h264Target, T.av1Target, T.vp9Target, T.aacTarget, T.opusTarget]
};

/**
 * A browser that plays MP4 files but no Matroska files, so Matroska needs a remux
 */
const noMatroskaBrowser: FakeBrowser = {
  file: [T.h264Mp4, T.aacMp4],
  ms: fullBrowser.ms
};

/**
 * A browser without proprietary codecs (like Playwright's Chromium): no H.264, no AAC
 */
const freeBrowser: FakeBrowser = {
  file: [T.opusMkv],
  ms: [T.opusMp4, T.av1Target, T.vp9Target, T.opusTarget]
};

/**
 * Nothing learned yet for any signature
 */
function noFloor(_signature: string): PlaybackMethod | undefined {
  return;
}

const defaultEnvironment: VerdictEnvironment = {
  hdrDisplay: undefined,
  hdrMode: 'auto',
  canSelectAudioTrack: false,
  quality: { type: 'auto' },
  policy: {},
  minimumRung: noFloor,
  subtitleRenderers: RENDERERS
};

/**
 * H.264 + AAC in MP4, probed
 */
function mp4Item(extra: { video?: Partial<MediaStream>; audio?: Partial<MediaStream>; source?: Partial<MediaSourceInfo> } = {}) {
  const source = mediaSource([videoStream(extra.video), audioStream(extra.audio)], extra.source);
  const probe = probeOk('video/mp4', [probedVideo()], [probedAudio()]);

  return { source, probe };
}

/**
 * H.264 + the given audio in Matroska, probed
 */
function mkvItem(audio: 'aac' | 'ac3' | 'opus' = 'aac', extraStreams: MediaStream[] = [], sourceExtra: Partial<MediaSourceInfo> = {}) {
  const audioByCodec = {
    aac: { stream: audioStream({ Codec: 'aac', CodecTag: undefined }), probed: probedAudio({ internalCodecId: 'A_AAC' }) },
    ac3: { stream: audioStream({ Codec: 'ac3', CodecTag: undefined, Channels: 6, Profile: undefined }), probed: probedAudio({ codec: 'ac3', codecString: 'ac-3', internalCodecId: 'A_AC3', channels: 6 }) },
    opus: { stream: audioStream({ Codec: 'opus', CodecTag: undefined }), probed: probedAudio({ codec: 'opus', codecString: 'opus', internalCodecId: 'A_OPUS' }) }
  }[audio];
  const source = mediaSource(
    [videoStream({ CodecTag: undefined }), audioByCodec.stream, ...extraStreams],
    { Container: 'mkv', ...sourceExtra }
  );
  const probe = probeOk('video/x-matroska', [probedVideo({ internalCodecId: 'V_MPEG4/ISO/AVC' })], [audioByCodec.probed]);

  return { source, probe };
}

/**
 * HEVC 10-bit + the given audio in Matroska, probed
 */
function hevcMkvItem(video: Partial<MediaStream> = {}, audio: 'aac' | 'ac3' = 'aac') {
  const base = mkvItem(audio);
  const hevc = videoStream({ Codec: 'hevc', CodecTag: undefined, Profile: 'Main 10', BitDepth: 10, ...video });
  const source = { ...base.source, MediaStreams: [hevc, ...(base.source.MediaStreams ?? []).slice(1)] };
  const probe = base.probe.status === 'ok'
    ? {
        ...base.probe,
        video: [probedVideo({
          codec: 'hevc',
          codecString: 'hev1.2.4.L93.B0',
          internalCodecId: 'V_MPEGH/ISO/HEVC',
          colorSpace: {},
          ...(video.Width && video.Height && { width: video.Width, height: video.Height })
        })]
      }
    : base.probe;

  return { source, probe };
}

/**
 * Computes a verdict with the default environment and the given overrides
 */
async function verdictFor(
  item: { source: MediaSourceInfo; probe?: ProbeResult },
  browser: FakeBrowser,
  overrides: Partial<Omit<VerdictInput, 'source' | 'oracle' | 'environment'>> & { environment?: Partial<VerdictEnvironment> } = {}
): Promise<Verdict> {
  const { environment, ...rest } = overrides;

  return computeVerdict({
    source: item.source,
    probe: item.probe,
    oracle: fakeOracle(browser),
    ...rest,
    environment: { ...defaultEnvironment, ...environment }
  });
}

describe('direct play: video and selected audio playable as a file, no blocker', () => {
  test('H.264 + AAC in MP4 on a browser that plays both is played directly, copying both streams', async () => {
    const verdict = await verdictFor(mp4Item(), fullBrowser);

    expect(verdict).toMatchObject({
      method: 'DirectPlay',
      reasons: [],
      smooth: true,
      unverified: false,
      video: { index: 0, action: 'copy' },
      audio: { index: 1, action: 'copy' }
    });
  });

  test('nothing is capped when the method is direct play', async () => {
    const verdict = await verdictFor(mp4Item(), fullBrowser);

    expect([verdict.qualityCap, verdict.maxAudioChannels]).toEqual([undefined, undefined]);
  });
});

describe('remux: a stream that does not play as a file but plays through media-source with the same codec', () => {
  test('H.264 + AAC in Matroska on a browser without Matroska files is remuxed, copying both streams', async () => {
    const verdict = await verdictFor(mkvItem(), noMatroskaBrowser);

    expect(verdict).toMatchObject({
      method: 'Remux',
      reasons: ['ContainerUnsupported'],
      video: { action: 'copy' },
      audio: { action: 'copy' }
    });
  });

  test('the same file is played directly where Matroska files play', async () => {
    const verdict = await verdictFor(mkvItem(), fullBrowser);

    expect(verdict.method).toBe('DirectPlay');
  });
});

describe('secondary audio track', () => {
  const twoTracks = () => mkvItem('aac', [audioStream({ Index: 2, Codec: 'opus', CodecTag: undefined, IsDefault: false })]);
  const withProbedOpus = () => {
    const item = twoTracks();

    return {
      ...item,
      probe: item.probe.status === 'ok'
        ? { ...item.probe, audio: [...item.probe.audio, probedAudio({ codec: 'opus', codecString: 'opus', internalCodecId: 'A_OPUS' })] }
        : item.probe
    };
  };

  test('a track other than the file\'s first audio track needs at least a remux when the element cannot switch tracks', async () => {
    const verdict = await verdictFor(withProbedOpus(), fullBrowser, { audioStreamIndex: 2 });

    expect(verdict).toMatchObject({ method: 'Remux', reasons: ['SecondaryAudioTrack'], audio: { index: 2, action: 'copy' } });
  });

  test('it does not block direct play when the element can switch audio tracks', async () => {
    const verdict = await verdictFor(withProbedOpus(), fullBrowser, { audioStreamIndex: 2, environment: { canSelectAudioTrack: true } });

    expect(verdict).toMatchObject({ method: 'DirectPlay', audio: { index: 2 } });
  });

  test('the first track never counts as secondary', async () => {
    const verdict = await verdictFor(withProbedOpus(), fullBrowser, { audioStreamIndex: 1 });

    expect(verdict.method).toBe('DirectPlay');
  });

  test('the server\'s default audio index is used when no track is selected, and it can be a secondary track', async () => {
    const item = withProbedOpus();
    const verdict = await verdictFor({ ...item, source: { ...item.source, DefaultAudioStreamIndex: 2 } }, fullBrowser);

    expect(verdict).toMatchObject({ method: 'Remux', audio: { index: 2 } });
  });

  test('an external audio file is never part of the file: at least a remux', async () => {
    const external = audioStream({ Index: 5, Codec: 'aac', CodecTag: undefined, IsExternal: true });
    const item = mkvItem('aac', [external]);
    // External files are not probed: the generic string is what the browser is asked about
    const browser = { ...fullBrowser, ms: [...(fullBrowser.ms ?? []), 'audio/mp4; codecs="aac"'] };
    const verdict = await verdictFor(item, browser, { audioStreamIndex: 5, environment: { canSelectAudioTrack: true } });

    expect(verdict).toMatchObject({ method: 'Remux', reasons: ['ExternalAudioTrack'], audio: { index: 5, action: 'copy' } });
  });
});

describe('audio transcode: audio unsupported in both modes, video copyable', () => {
  test('AC-3 on a browser without AC-3 is encoded to AAC while the video is copied', async () => {
    const verdict = await verdictFor(mkvItem('ac3'), fullBrowser);

    expect(verdict).toMatchObject({
      method: 'TranscodeAudio',
      reasons: ['AudioCodecUnsupported'],
      video: { action: 'copy' },
      audio: { action: 'transcode', targets: [{ codec: 'aac' }, { codec: 'opus' }] }
    });
  });

  test('surround is kept (5.1) when the browser accepts the target with that many channels', async () => {
    const verdict = await verdictFor(mkvItem('ac3'), fullBrowser);

    expect(verdict.maxAudioChannels).toBe(6);
  });

  test('otherwise the audio is downmixed to stereo', async () => {
    const verdict = await verdictFor(mkvItem('ac3'), { ...fullBrowser, maxChannels: { [T.aacTarget]: 2 } });

    expect(verdict.maxAudioChannels).toBe(2);
  });

  /**
   * The AC-3 Matroska item with another channel count, as the server and the probe both report it
   */
  const ac3WithChannels = (channels: number) => {
    const item = mkvItem('ac3');
    const streams = (item.source.MediaStreams ?? []).map(stream => stream.Type === 'Audio' ? { ...stream, Channels: channels } : stream);
    const probe = item.probe.status === 'ok' ? { ...item.probe, audio: item.probe.audio.map(track => ({ ...track, channels })) } : item.probe;

    return { source: { ...item.source, MediaStreams: streams }, probe };
  };

  test('more than 5.1 channels are asked as 5.1', async () => {
    const verdict = await verdictFor(ac3WithChannels(8), fullBrowser);

    expect(verdict.maxAudioChannels).toBe(6);
  });

  test('a stereo source is never upmixed', async () => {
    const verdict = await verdictFor(ac3WithChannels(2), fullBrowser);

    expect(verdict.maxAudioChannels).toBe(2);
  });

  test('without AAC support the free fallback (Opus) is the target', async () => {
    const browser = { ...fullBrowser, ms: (fullBrowser.ms ?? []).filter(type => type !== T.aacTarget) };
    const verdict = await verdictFor(mkvItem('ac3'), browser);

    expect(verdict.audio).toMatchObject({ action: 'transcode', targets: [{ codec: 'opus' }] });
  });

  test('a video that plays through media-source but not as a file is copied while the audio is encoded', async () => {
    const verdict = await verdictFor(mkvItem('ac3'), noMatroskaBrowser);

    expect(verdict).toMatchObject({
      method: 'TranscodeAudio',
      reasons: ['ContainerUnsupported', 'AudioCodecUnsupported'],
      video: { action: 'copy' }
    });
  });

  test('a video that plays as a file but not through media-source cannot be copied: the video is transcoded too', async () => {
    const browser = { file: [T.h264Mkv, T.aacMkv], ms: [T.h264Target, T.aacTarget] };
    const verdict = await verdictFor(mkvItem('ac3'), browser);

    expect(verdict).toMatchObject({ method: 'TranscodeVideo', video: { action: 'transcode' }, audio: { action: 'transcode' } });
  });
});

describe('video transcode: video unsupported in both modes', () => {
  test('HEVC on a browser without HEVC is encoded to H.264, the audio is copied when it can be', async () => {
    const verdict = await verdictFor(hevcMkvItem(), fullBrowser);

    expect(verdict).toMatchObject({
      method: 'TranscodeVideo',
      reasons: ['VideoCodecUnsupported'],
      video: { action: 'transcode', targets: [{ codec: 'h264' }, { codec: 'av1' }, { codec: 'vp9' }] },
      audio: { action: 'copy' }
    });
  });

  test('the audio is encoded as well when it cannot be copied', async () => {
    const verdict = await verdictFor(hevcMkvItem({}, 'ac3'), fullBrowser);

    expect(verdict).toMatchObject({
      method: 'TranscodeVideo',
      reasons: ['VideoCodecUnsupported', 'AudioCodecUnsupported'],
      audio: { action: 'transcode', targets: [{ codec: 'aac' }, { codec: 'opus' }] },
      maxAudioChannels: 6
    });
  });

  test('without H.264 support the free fallback targets are used, in order', async () => {
    const verdict = await verdictFor(hevcMkvItem(), freeBrowser);

    expect(verdict).toMatchObject({
      method: 'TranscodeVideo',
      video: { targets: [{ codec: 'av1' }, { codec: 'vp9' }] },
      audio: { action: 'transcode', targets: [{ codec: 'opus' }] }
    });
  });

  test('without codec reasons for a cap, the video is encoded at the source\'s own level', async () => {
    const verdict = await verdictFor(hevcMkvItem({ Width: 1920, Height: 1080 }), fullBrowser);

    expect(verdict.qualityCap).toEqual({ maxBitrate: 8_000_000, maxWidth: 1920, maxHeight: 1080 });
  });

  test('targets are never assumed: a browser that decodes none of them makes the source unplayable', async () => {
    const verdict = await verdictFor(hevcMkvItem(), { file: [T.aacMkv], ms: [T.aacMp4] });

    expect(verdict).toMatchObject({ method: 'Unplayable', reasons: ['VideoCodecUnsupported', 'NoDecodableTarget'] });
  });

  test('targets are asked to the browser through media-source', async () => {
    const oracle = fakeOracle(fullBrowser);

    await computeVerdict({ ...hevcMkvItem(), oracle, environment: defaultEnvironment });

    const askedTargets = oracle.asked.filter(config => config.video?.contentType === T.h264Target);

    expect(askedTargets.map(config => config.type)).toEqual(['media-source']);
  });
});

describe('subtitles', () => {
  const withSubtitle = (subtitle: MediaStream, sourceExtra: Partial<MediaSourceInfo> = {}) => mkvItem('aac', [subtitle], sourceExtra);

  test('a selected subtitle that has to be burnt in means transcoding the video', async () => {
    const verdict = await verdictFor(withSubtitle(subtitleStream('DVDSUB', false)), fullBrowser, { subtitleStreamIndex: 2 });

    expect(verdict).toMatchObject({
      method: 'TranscodeVideo',
      reasons: ['SubtitleBurnIn'],
      subtitle: { index: 2, class: 'burn-in', delivery: 'Encode' }
    });
  });

  const neverChange: [string, MediaStream, string][] = [
    ['a native subtitle', subtitleStream('webvtt', true), 'native'],
    ['a renderer subtitle', subtitleStream('ass', true), 'renderer'],
    ['a server-converted subtitle', subtitleStream('subrip', true), 'server-text']
  ];

  test.each(neverChange)('%s never changes the method', async (_, subtitle, subtitleClass) => {
    const verdict = await verdictFor(withSubtitle(subtitle), fullBrowser, { subtitleStreamIndex: 2 });

    expect(verdict).toMatchObject({ method: 'DirectPlay', subtitle: { index: 2, class: subtitleClass, delivery: 'External' } });
  });

  test('-1 means no subtitle, even if the server has a default one', async () => {
    const verdict = await verdictFor(withSubtitle(subtitleStream('DVDSUB', false), { DefaultSubtitleStreamIndex: 2 }), fullBrowser, { subtitleStreamIndex: -1 });

    expect([verdict.method, verdict.subtitle]).toEqual(['DirectPlay', undefined]);
  });

  test('without a selection the server\'s default subtitle is evaluated', async () => {
    const verdict = await verdictFor(withSubtitle(subtitleStream('DVDSUB', false), { DefaultSubtitleStreamIndex: 2 }), fullBrowser);

    expect(verdict.method).toBe('TranscodeVideo');
  });

  test('without a selection and without a default, there is no subtitle', async () => {
    const verdict = await verdictFor(withSubtitle(subtitleStream('DVDSUB', false)), fullBrowser);

    expect(verdict.subtitle).toBeUndefined();
  });
});

describe('HDR video on an SDR display', () => {
  const hdr10 = () => {
    const item = mp4Item({ video: { Codec: 'h264', VideoRange: 'HDR', VideoRangeType: 'HDR10', ColorTransfer: 'smpte2084', ColorPrimaries: 'bt2020' } });
    const probe = probeOk('video/mp4', [probedVideo({ colorSpace: { primaries: 'bt2020', transfer: 'pq' }, hdr: true })], [probedAudio()]);

    return { ...item, probe };
  };
  const hdrBrowser: FakeBrowser = fullBrowser;
  const cases: [string, Partial<VerdictEnvironment>, PlaybackMethod][] = [
    ['in automatic HDR mode the server tone-maps it: video transcode', { hdrDisplay: false, hdrMode: 'auto' }, 'TranscodeVideo'],
    ['when the browser is left to adapt it, nothing changes', { hdrDisplay: false, hdrMode: 'browser' }, 'DirectPlay'],
    ['when the engine cannot tell the display, nothing changes', { hdrDisplay: undefined, hdrMode: 'auto' }, 'DirectPlay'],
    ['on an HDR display, nothing changes', { hdrDisplay: true, hdrMode: 'auto' }, 'DirectPlay']
  ];

  test.each(cases)('%s', async (_, environment, expected) => {
    const verdict = await verdictFor(hdr10(), hdrBrowser, { environment });

    expect(verdict.method).toBe(expected);
  });

  test('the reason is HDR on an SDR display', async () => {
    const verdict = await verdictFor(hdr10(), hdrBrowser, { environment: { hdrDisplay: false } });

    expect(verdict.reasons).toEqual(['HdrOnSdrDisplay']);
  });

  test('SDR video is not affected by an SDR display', async () => {
    const verdict = await verdictFor(mp4Item(), fullBrowser, { environment: { hdrDisplay: false } });

    expect(verdict.method).toBe('DirectPlay');
  });

  test('Dolby Vision with an SDR base layer is SDR video for this rule', async () => {
    const item = mp4Item({ video: { VideoRange: 'SDR', VideoRangeType: 'DOVIWithSDR', DvProfile: 8, DvLevel: 6 } });
    const verdict = await verdictFor(item, fullBrowser, { environment: { hdrDisplay: false } });

    expect(verdict.method).toBe('DirectPlay');
  });
});

describe('quality cap', () => {
  const fullHd = () => {
    const item = mp4Item({ video: { Width: 1920, Height: 1080 } });

    return { ...item, probe: probeOk('video/mp4', [probedVideo({ width: 1920, height: 1080 })], [probedAudio()]) };
  };

  test('a fixed level below the source transcodes the video, capped at that level', async () => {
    const verdict = await verdictFor(fullHd(), fullBrowser, { environment: { quality: { type: 'fixed', level: 720 } } });

    expect(verdict).toMatchObject({
      method: 'TranscodeVideo',
      reasons: ['ExceedsQuality'],
      qualityCap: { maxBitrate: 5_000_000, maxWidth: 1280, maxHeight: 720 }
    });
  });

  const noForce: [string, VerdictEnvironment['quality']][] = [
    ['a fixed level equal to the source', { type: 'fixed', level: 1080 }],
    ['a fixed level above the source', { type: 'fixed', level: 2160 }],
    ['automatic without a current cap', { type: 'auto' }],
    ['automatic capped at a level the source fits', { type: 'auto', level: 1080 }]
  ];

  test.each(noForce)('%s does not force anything', async (_, quality) => {
    const verdict = await verdictFor(fullHd(), fullBrowser, { environment: { quality } });

    expect(verdict.method).toBe('DirectPlay');
  });

  test('automatic\'s current level caps like a fixed one', async () => {
    const verdict = await verdictFor(fullHd(), fullBrowser, { environment: { quality: { type: 'auto', level: 480 } } });

    expect(verdict).toMatchObject({ method: 'TranscodeVideo', qualityCap: { maxBitrate: 2_500_000, maxWidth: 854, maxHeight: 480 } });
  });

  const heavyFullHd = () => {
    const item = fullHd();
    const streams = (item.source.MediaStreams ?? []).map(stream => stream.Type === 'Video' ? { ...stream, BitRate: 40_000_000 } : stream);

    return { ...item, source: { ...item.source, MediaStreams: streams, Bitrate: 40_128_000 } };
  };

  test('automatic at the source\'s own level encodes a source whose bitrate is above the level\'s, at the ladder bitrate', async () => {
    const verdict = await verdictFor(heavyFullHd(), fullBrowser, { environment: { quality: { type: 'auto', level: 1080 } } });

    expect(verdict).toMatchObject({
      method: 'TranscodeVideo',
      reasons: ['ExceedsQuality'],
      qualityCap: { maxBitrate: 8_000_000, maxWidth: 1920, maxHeight: 1080 }
    });
  });

  test('a fixed level equal to the source does not force anything, whatever its bitrate', async () => {
    const verdict = await verdictFor(heavyFullHd(), fullBrowser, { environment: { quality: { type: 'fixed', level: 1080 } } });

    expect(verdict.method).toBe('DirectPlay');
  });
});

describe('quality mode "original": only direct play and remux', () => {
  const original: Partial<VerdictEnvironment> = { quality: { type: 'original' } };

  test('direct play is allowed', async () => {
    const verdict = await verdictFor(mp4Item(), fullBrowser, { environment: original });

    expect(verdict.method).toBe('DirectPlay');
  });

  test('remux is allowed', async () => {
    const verdict = await verdictFor(mkvItem(), noMatroskaBrowser, { environment: original });

    expect(verdict.method).toBe('Remux');
  });

  test('anything that has to be encoded is unplayable with this quality', async () => {
    const verdict = await verdictFor(mkvItem('ac3'), fullBrowser, { environment: original });

    expect(verdict).toMatchObject({ method: 'Unplayable', reasons: ['AudioCodecUnsupported', 'NotAllowedByQuality'] });
  });
});

describe('user policy', () => {
  test('without remuxing, a container problem goes up to the next allowed rung', async () => {
    const verdict = await verdictFor(mkvItem(), noMatroskaBrowser, { environment: { policy: { EnablePlaybackRemuxing: false } } });

    expect(verdict).toMatchObject({ method: 'TranscodeAudio', reasons: ['ContainerUnsupported', 'NotAllowedByPolicy'] });
  });

  test('without video transcoding, an unsupported video is unplayable', async () => {
    const verdict = await verdictFor(hevcMkvItem(), fullBrowser, { environment: { policy: { EnableVideoPlaybackTranscoding: false } } });

    expect(verdict).toMatchObject({ method: 'Unplayable', reasons: ['VideoCodecUnsupported', 'NotAllowedByPolicy'] });
  });

  test('without audio transcoding, an unsupported audio is unplayable (a video transcode would encode it too)', async () => {
    const verdict = await verdictFor(mkvItem('ac3'), fullBrowser, { environment: { policy: { EnableAudioPlaybackTranscoding: false } } });

    expect(verdict).toMatchObject({ method: 'Unplayable', reasons: ['AudioCodecUnsupported', 'NotAllowedByPolicy'] });
  });

  test('without audio transcoding, a video transcode is still possible when the audio is copied', async () => {
    const verdict = await verdictFor(hevcMkvItem(), fullBrowser, { environment: { policy: { EnableAudioPlaybackTranscoding: false } } });

    expect(verdict).toMatchObject({ method: 'TranscodeVideo', audio: { action: 'copy' } });
  });

  test('flags the server did not send count as allowed', async () => {
    const verdict = await verdictFor(mkvItem(), noMatroskaBrowser, { environment: { policy: {} } });

    expect(verdict.method).toBe('Remux');
  });

  test('without video transcoding there is no remux of a video either: the server serves its HLS output only to users who may transcode video', async () => {
    const verdict = await verdictFor(mkvItem(), noMatroskaBrowser, { environment: { policy: { EnableVideoPlaybackTranscoding: false } } });

    expect(verdict).toMatchObject({ method: 'Unplayable', reasons: ['ContainerUnsupported', 'NotAllowedByPolicy'] });
  });

  test('without video transcoding there is no audio transcode of a video either, for the same reason', async () => {
    const verdict = await verdictFor(mkvItem('ac3'), fullBrowser, { environment: { policy: { EnableVideoPlaybackTranscoding: false } } });

    expect(verdict).toMatchObject({ method: 'Unplayable', reasons: ['AudioCodecUnsupported', 'NotAllowedByPolicy'] });
  });

  test('without video transcoding a playable video is still played directly', async () => {
    const verdict = await verdictFor(mp4Item(), fullBrowser, { environment: { policy: { EnableVideoPlaybackTranscoding: false, EnableAudioPlaybackTranscoding: false } } });

    expect(verdict.method).toBe('DirectPlay');
  });
});

describe('learned floor: the minimum rung known to be needed for these streams', () => {
  const rungs: [string, PlaybackMethod, PlaybackMethod][] = [
    ['a floor of remux starts at remux', 'Remux', 'Remux'],
    ['a floor of audio transcode starts at audio transcode', 'TranscodeAudio', 'TranscodeAudio'],
    ['a floor of video transcode starts at video transcode', 'TranscodeVideo', 'TranscodeVideo'],
    ['a floor of unplayable means nothing is left', 'Unplayable', 'Unplayable']
  ];

  test.each(rungs)('%s', async (_, floor, expected) => {
    const verdict = await verdictFor(mp4Item(), fullBrowser, { environment: { minimumRung: () => floor } });

    expect([verdict.method, verdict.reasons.includes('FailedBefore')]).toEqual([expected, true]);
  });

  test('a Remux verdict that the server turned into a video encode goes straight to video transcode next time', async () => {
    const first = await verdictFor(mkvItem(), noMatroskaBrowser);
    const floor = getNextFloor(first, { actualMethod: 'TranscodeVideo' });
    const next = await verdictFor(mkvItem(), noMatroskaBrowser, { environment: { minimumRung: () => floor } });

    expect([first.method, floor, next.method]).toEqual(['Remux', 'TranscodeVideo', 'TranscodeVideo']);
  });

  test('a floor never lowers a verdict below what the browser answers require', async () => {
    const verdict = await verdictFor(mkvItem('ac3'), fullBrowser, { environment: { minimumRung: () => 'Remux' } });

    expect(verdict.method).toBe('TranscodeAudio');
  });

  test('a floor above what the quality mode allows is unplayable, because of the quality', async () => {
    const verdict = await verdictFor(mp4Item(), fullBrowser, {
      environment: { minimumRung: () => 'TranscodeVideo', quality: { type: 'original' } }
    });

    expect(verdict).toMatchObject({ method: 'Unplayable', reasons: ['FailedBefore', 'NotAllowedByQuality'] });
  });

  test('a floor above what the user policy allows is unplayable, because of the policy', async () => {
    const verdict = await verdictFor(mp4Item(), fullBrowser, {
      environment: { minimumRung: () => 'TranscodeVideo', policy: { EnableVideoPlaybackTranscoding: false } }
    });

    expect(verdict).toMatchObject({ method: 'Unplayable', reasons: ['FailedBefore', 'NotAllowedByPolicy'] });
  });

  test('the floor is looked up with the verdict\'s own signature', async () => {
    const asked = new Set<string>();
    const verdict = await verdictFor(mp4Item(), fullBrowser, {
      environment: {
        minimumRung: (signature) => {
          asked.add(signature);

          return noFloor(signature);
        }
      }
    });

    expect([...asked]).toEqual([verdict.signature]);
  });
});

describe('getNextFloor: every caller records what it learned the same way', () => {
  const remux = { method: 'Remux' } as const;
  const cases: [string, Pick<Verdict, 'method'>, Parameters<typeof getNextFloor>[1], PlaybackMethod | undefined, PlaybackMethod | undefined][] = [
    ['a runtime failure at direct play raises the floor to remux', { method: 'DirectPlay' }, { failedAt: 'DirectPlay' }, undefined, 'Remux'],
    ['a runtime failure at remux raises it to audio transcode', remux, { failedAt: 'Remux' }, undefined, 'TranscodeAudio'],
    ['a runtime failure at audio transcode raises it to video transcode', { method: 'TranscodeAudio' }, { failedAt: 'TranscodeAudio' }, undefined, 'TranscodeVideo'],
    ['a runtime failure at video transcode leaves nothing', { method: 'TranscodeVideo' }, { failedAt: 'TranscodeVideo' }, undefined, 'Unplayable'],
    ['a server that chose a more expensive method sets the floor to that method', remux, { actualMethod: 'TranscodeVideo' }, undefined, 'TranscodeVideo'],
    ['a server that chose the same method teaches nothing', remux, { actualMethod: 'Remux' }, undefined, undefined],
    ['a server that chose a cheaper method teaches nothing', remux, { actualMethod: 'DirectPlay' }, undefined, undefined],
    ['a server that cannot play it at all is a failure at the verdict\'s method', remux, { actualMethod: 'Unplayable' }, undefined, 'TranscodeAudio'],
    ['floors only rise', { method: 'DirectPlay' }, { failedAt: 'DirectPlay' }, 'TranscodeVideo', 'TranscodeVideo'],
    ['an unplayable verdict teaches nothing', { method: 'Unplayable' }, { actualMethod: 'Unplayable' }, 'Remux', 'Remux']
  ];

  test.each(cases)('%s', (_, verdict, outcome, current, expected) => {
    const floor = getNextFloor(verdict, outcome, current);

    expect(floor).toBe(expected);
  });
});

describe('smoothness only scores', () => {
  test('a direct play the browser reports as not smooth is still a direct play, flagged', async () => {
    const verdict = await verdictFor(mp4Item(), { ...fullBrowser, notSmooth: [T.h264Mp4] });

    expect(verdict).toMatchObject({ method: 'DirectPlay', smooth: false, reasons: ['NotSmooth'] });
  });

  test('smoothness is that of the path actually chosen (here the transcoding target)', async () => {
    const verdict = await verdictFor(hevcMkvItem(), { ...fullBrowser, notSmooth: [T.h264Target] });

    expect([verdict.method, verdict.smooth]).toEqual(['TranscodeVideo', false]);
  });
});

describe('audio-only items (music) follow the same rules without video', () => {
  const track = (codec: 'mp3' | 'flac', container: string, mime: string, codecString: string) => ({
    source: mediaSource([audioStream({ Index: 0, Codec: codec, CodecTag: undefined })], { Container: container, DefaultAudioStreamIndex: 0 }),
    probe: probeOk(mime, [], [probedAudio({ codec, codecString, internalCodecId: undefined })])
  });

  const impliedFlac = () => {
    const item = track('flac', 'flac', 'audio/flac', 'flac');

    return { ...item, probe: probeOk('audio/flac', [], [probedAudio({ codec: 'flac', codecString: 'flac', internalCodecId: undefined })], true) };
  };

  test('a FLAC file in a browser that only accepts its bare MIME type (the codec is implied) is played directly', async () => {
    const verdict = await verdictFor(impliedFlac(), { file: ['audio/flac'], ms: [T.flacMp4] });

    expect(verdict.method).toBe('DirectPlay');
  });

  test('without the probe saying the codec is implied, the bare MIME type is never asked', async () => {
    const verdict = await verdictFor(track('flac', 'flac', 'audio/flac', 'flac'), { file: ['audio/flac'], ms: [T.flacMp4] });

    expect(verdict.method).toBe('Remux');
  });

  test('a playable MP3 is played directly', async () => {
    const verdict = await verdictFor(track('mp3', 'mp3', 'audio/mpeg', 'mp3'), fullBrowser);

    expect(verdict).toMatchObject({ method: 'DirectPlay', audio: { index: 0, action: 'copy' } });
    expect(verdict.video).toBeUndefined();
  });

  test('an unplayable FLAC is transcoded to the first supported audio target', async () => {
    const verdict = await verdictFor(track('flac', 'flac', 'audio/flac', 'flac'), { file: [], ms: [T.aacTarget] });

    expect(verdict).toMatchObject({ method: 'TranscodeAudio', audio: { action: 'transcode', targets: [{ codec: 'aac' }] } });
  });

  test('a quality level never forces anything on music', async () => {
    const verdict = await verdictFor(track('mp3', 'mp3', 'audio/mpeg', 'mp3'), fullBrowser, { environment: { quality: { type: 'fixed', level: 360 } } });

    expect(verdict.method).toBe('DirectPlay');
  });

  test('without audio transcoding there is no remux of music: the server serves its HLS output only to users who may transcode audio', async () => {
    const verdict = await verdictFor(track('flac', 'flac', 'audio/flac', 'flac'), { file: ['audio/flac'], ms: [T.flacMp4] }, { environment: { policy: { EnableAudioPlaybackTranscoding: false } } });

    expect(verdict).toMatchObject({ method: 'Unplayable', reasons: ['ContainerUnsupported', 'NotAllowedByPolicy'] });
  });

  test('without video transcoding music is still remuxed: that permission is about videos', async () => {
    const verdict = await verdictFor(track('flac', 'flac', 'audio/flac', 'flac'), { file: ['audio/flac'], ms: [T.flacMp4] }, { environment: { policy: { EnableVideoPlaybackTranscoding: false } } });

    expect(verdict.method).toBe('Remux');
  });

  test('"original" refuses to encode music too', async () => {
    const verdict = await verdictFor(track('flac', 'flac', 'audio/flac', 'flac'), { file: [], ms: [T.aacTarget] }, { environment: { quality: { type: 'original' } } });

    expect(verdict.method).toBe('Unplayable');
  });
});

describe('the media type of the item, which decides how the server treats it', () => {
  const audioOnly = () => ({
    source: mediaSource([audioStream({ Index: 0 })], { Container: 'mp4' }),
    probe: probeOk('video/mp4', [], [probedAudio()])
  });

  test('a video item without a video stream (an audio-only file in a video library) is a video for the server', async () => {
    const verdict = await verdictFor(audioOnly(), fullBrowser, { mediaType: 'Video' });

    expect(verdict).toMatchObject({ method: 'DirectPlay', mediaType: 'Video' });
    expect(verdict.video).toBeUndefined();
  });

  test('so its rungs above direct play need the permission to transcode video, like any video\'s', async () => {
    const verdict = await verdictFor(audioOnly(), { file: [], ms: fullBrowser.ms }, {
      mediaType: 'Video',
      environment: { policy: { EnableVideoPlaybackTranscoding: false, EnableAudioPlaybackTranscoding: true } }
    });

    expect(verdict).toMatchObject({ method: 'Unplayable', reasons: ['ContainerUnsupported', 'NotAllowedByPolicy'] });
  });

  test('music is music', async () => {
    const verdict = await verdictFor(audioOnly(), fullBrowser, { mediaType: 'Audio' });

    expect(verdict.mediaType).toBe('Audio');
  });

  test('without the media type, the streams tell', async () => {
    const [video, music] = await Promise.all([verdictFor(mp4Item(), fullBrowser), verdictFor(audioOnly(), fullBrowser)]);

    expect([video.mediaType, music.mediaType]).toEqual(['Video', 'Audio']);
  });
});

describe('no stream metadata at all (live TV, .strm, remote)', () => {
  test('the verdict is an optimistic direct play, flagged as unverified', async () => {
    const verdict = await verdictFor({ source: mediaSource([], { Container: 'strm', MediaStreams: [] }) }, { file: [], ms: [] });

    expect(verdict).toMatchObject({ method: 'DirectPlay', unverified: true, reasons: ['Unverified'] });
  });

  test('a missing stream list counts as no metadata too', async () => {
    const verdict = await verdictFor({ source: mediaSource([], { MediaStreams: undefined }) }, { file: [], ms: [] });

    expect(verdict.unverified).toBe(true);
  });
});

describe('probe matching and fallbacks', () => {
  test('probed tracks are matched by order within each type, ignoring external streams', async () => {
    const source = mediaSource([
      subtitleStream('subrip', true, { Index: 0, IsExternal: true }),
      videoStream({ Index: 2 }),
      audioStream({ Index: 3 })
    ], { DefaultAudioStreamIndex: 3 });
    const verdict = await verdictFor({ source, probe: probeOk('video/mp4', [probedVideo()], [probedAudio()]) }, { file: [T.h264Mp4, T.aacMp4], ms: [] });

    expect(verdict).toMatchObject({ method: 'DirectPlay', video: { index: 2 }, audio: { index: 3 } });
  });

  test('without a probe, the generic candidates decide (here: unknown to the browser, so transcode)', async () => {
    const verdict = await verdictFor({ source: mkvItem('ac3').source }, fullBrowser);

    expect(verdict.method).toBe('TranscodeVideo');
  });

  test('a failed probe is the same as no probe', async () => {
    const failed: ProbeResult = { status: 'failed', reason: 'network', detail: 'TypeError', cacheable: false, stats: { requests: 1, bytes: 0, durationMs: 1 } };
    const verdict = await verdictFor({ source: mkvItem('ac3').source, probe: failed }, fullBrowser);

    expect(verdict.method).toBe('TranscodeVideo');
  });

  test('the selected video stream is honoured by its absolute index', async () => {
    const source = mediaSource([videoStream({ Index: 0 }), videoStream({ Index: 1, Width: 320, Height: 180 }), audioStream({ Index: 2 })]);
    const probe = probeOk('video/mp4', [probedVideo(), probedVideo({ width: 320, height: 180 })], [probedAudio()]);
    const verdict = await verdictFor({ source, probe }, fullBrowser, { videoStreamIndex: 1 });

    expect(verdict.video?.index).toBe(1);
  });
});

describe('the file a direct play question is about', () => {
  /**
   * An oracle that records the file each question was asked about, and supports everything
   */
  function recordingOracle() {
    const files = new Map<string, string | undefined>();
    const oracle: CapabilityOracle = {
      clear: () => {
        // Nothing to forget
      },
      query: (config, context) => {
        const contentType = config.video?.contentType ?? config.audio?.contentType ?? '';

        files.set(`${config.type} ${contentType}`, context?.fileType);

        return Promise.resolve({ supported: true, smooth: true, powerEfficient: true });
      }
    };

    return { files, oracle };
  }

  /**
   * Computes a verdict with the recording oracle
   */
  async function filesAskedFor(item: { source: MediaSourceInfo; probe?: ProbeResult }) {
    const { files, oracle } = recordingOracle();

    await computeVerdict({ source: item.source, probe: item.probe, oracle, environment: defaultEnvironment });

    return files;
  }

  test('the audio of a probed video file is asked about together with the file\'s own MIME type', async () => {
    const files = await filesAskedFor(mkvItem('opus'));

    expect(files.get(`file ${T.opusMkv}`)).toBe('video/x-matroska');
  });

  test('the video of a probed file too', async () => {
    const files = await filesAskedFor(mkvItem('opus'));

    expect(files.get(`file ${T.h264Mkv}`)).toBe('video/x-matroska');
  });

  test('media source questions are not about a file', async () => {
    const files = await filesAskedFor(mkvItem('opus'));

    expect(files.get(`media-source ${T.opusMp4}`)).toBeUndefined();
  });

  test('without a probe the real file type is unknown, so none is given', async () => {
    const files = await filesAskedFor({ source: mkvItem('opus').source });

    expect(files.values().every(fileType => fileType === undefined)).toBe(true);
  });
});

describe('signature: what the failure memory remembers', () => {
  test('it is made of the container MIME and the codec strings of the evaluated streams', async () => {
    const verdict = await verdictFor(mp4Item(), fullBrowser);

    expect(verdict.signature).toBe(`${T.h264Mp4}|${T.aacMp4}`);
  });

  test('two sources with the same streams share it', async () => {
    const a = await verdictFor(mp4Item({ source: { Id: 'a' } }), fullBrowser);
    const b = await verdictFor(mp4Item({ source: { Id: 'b' } }), fullBrowser);

    expect(a.signature).toBe(b.signature);
  });

  test('different audio streams give different signatures', async () => {
    const a = await verdictFor(mkvItem('aac'), fullBrowser);
    const b = await verdictFor(mkvItem('opus'), fullBrowser);

    expect(a.signature).not.toBe(b.signature);
  });
});
