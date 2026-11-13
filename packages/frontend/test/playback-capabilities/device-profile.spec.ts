import { describe, expect, test } from 'vitest';
import type { MediaSourceInfo, MediaStream, ProfileCondition } from '@jellyfin/sdk/lib/generated-client';
import { audioStream, mediaSource, RENDERERS, subtitleStream, videoStream } from './fixtures.ts';
import { buildPlaybackRequest, deriveActualMethod } from '#/utils/playback-capabilities/device-profile.ts';
import { UNLIMITED_STREAMING_BITRATE } from '#/utils/playback-capabilities/constants.ts';
import type { PlaybackMethod, Verdict } from '#/utils/playback-capabilities/verdict.ts';

const h264 = { codec: 'h264', codecString: 'avc1.640028' };
const vp9 = { codec: 'vp9', codecString: 'vp09.00.40.08' };
const aac = { codec: 'aac', codecString: 'mp4a.40.2', channels: 6 };
const opus = { codec: 'opus', codecString: 'opus', channels: 6 };

/**
 * An HEVC + AC-3 Matroska source with a SubRip and a DVD subtitle
 */
function hevcMkv(extra: Partial<MediaSourceInfo> = {}): MediaSourceInfo {
  return mediaSource([
    videoStream({ Codec: 'hevc', CodecTag: undefined, Width: 1920, Height: 1080, BitRate: 3_000_000 }),
    audioStream({ Codec: 'ac3', CodecTag: undefined, Channels: 6 }),
    subtitleStream('subrip', true, { Index: 2 }),
    subtitleStream('DVDSUB', false, { Index: 3 })
  ], { Container: 'mkv', Bitrate: 3_500_000, ...extra });
}

/**
 * A verdict for the HEVC source. A copied stream carries the targets the browser decodes, which the server encodes
 * to if it refuses the copy.
 */
function verdict(method: PlaybackMethod, extra: Partial<Verdict> = {}): Verdict {
  const copy = {
    video: { index: 0, action: 'copy' as const, fallback: [h264, vp9] },
    audio: { index: 1, action: 'copy' as const, fallback: [aac, opus] }
  };

  return {
    method,
    reasons: [],
    smooth: true,
    unverified: false,
    signature: 'sig',
    quality: { width: 1920, height: 1080, bitrate: 3_500_000 },
    ...copy,
    ...extra
  };
}

const transcodeAudio = verdict('TranscodeAudio', {
  audio: { index: 1, action: 'transcode', targets: [aac, opus] },
  maxAudioChannels: 6
});
const transcodeVideo = verdict('TranscodeVideo', {
  video: { index: 0, action: 'transcode', targets: [h264, vp9] },
  qualityCap: { maxBitrate: 5_000_000, maxWidth: 1280, maxHeight: 720 }
});
const transcodeBoth = verdict('TranscodeVideo', {
  video: { index: 0, action: 'transcode', targets: [h264] },
  audio: { index: 1, action: 'transcode', targets: [{ ...aac, channels: 2 }] },
  maxAudioChannels: 2,
  qualityCap: { maxBitrate: 8_000_000, maxWidth: 1920, maxHeight: 1080 }
});

describe('a browser that cannot play the server\'s HLS output: only direct play', () => {
  test('the server is not offered its HLS output, not even as the fallback of the direct play', () => {
    const { deviceProfile, options } = buildPlaybackRequest(
      verdict('DirectPlay', { onlyDirectPlay: true, video: { index: 0, action: 'copy' }, audio: { index: 1, action: 'copy' } }),
      hevcMkv(),
      RENDERERS
    );

    expect([deviceProfile.TranscodingProfiles, options.EnableTranscoding, options.EnableDirectPlay]).toEqual([[], false, true]);
    expect(deviceProfile.DirectPlayProfiles).toEqual([{ Type: 'Video', Container: 'mkv', VideoCodec: 'hevc', AudioCodec: 'ac3' }]);
  });
});

describe('direct play', () => {
  const { deviceProfile, options } = buildPlaybackRequest(verdict('DirectPlay'), hevcMkv(), RENDERERS);

  test('one direct play profile with exactly the source\'s container token and the streams\' codec names', () => {
    expect(deviceProfile.DirectPlayProfiles).toEqual([{ Type: 'Video', Container: 'mkv', VideoCodec: 'hevc', AudioCodec: 'ac3' }]);
  });

  test('the container is the source\'s own token list, never an alias', () => {
    const request = buildPlaybackRequest(verdict('DirectPlay'), hevcMkv({ Container: 'mov,mp4,m4a' }), RENDERERS);

    expect(request.deviceProfile.DirectPlayProfiles?.[0]?.Container).toBe('mov,mp4,m4a');
  });

  test('direct play is enabled and progressive direct stream is not', () => {
    expect(options).toMatchObject({ EnableDirectPlay: true, EnableDirectStream: false });
  });

  test('no bitrate limit, so the server never refuses direct play for it', () => {
    expect([options.MaxStreamingBitrate, deviceProfile.MaxStreamingBitrate]).toEqual([UNLIMITED_STREAMING_BITRATE, UNLIMITED_STREAMING_BITRATE]);
  });

  test('the server falls back to an HLS remux of the same streams if it refuses direct play, with the targets ahead in case it cannot copy them either', () => {
    expect(deviceProfile.TranscodingProfiles).toEqual([
      expect.objectContaining({ Type: 'Video', Protocol: 'hls', Container: 'mp4', VideoCodec: 'h264,vp9,hevc', AudioCodec: 'aac,opus,ac3' })
    ]);
  });
});

describe('a direct play that relies on streams nobody could check (unverified): the server falls back to the targets', () => {
  /**
   * The verdict for the HEVC source played directly while the browser could not be asked about the video exactly
   */
  const attempt = (extra: Partial<Verdict> = {}) => verdict('DirectPlay', {
    reasons: ['Unverified'],
    unverified: true,
    video: { index: 0, action: 'copy', fallback: [h264, vp9], unverified: true },
    ...extra
  });

  test('direct play is asked exactly as for any direct play: the container and codecs the server reported', () => {
    const { deviceProfile, options } = buildPlaybackRequest(attempt(), hevcMkv(), RENDERERS);

    expect([deviceProfile.DirectPlayProfiles, options.EnableDirectPlay]).toEqual([[{ Type: 'Video', Container: 'mkv', VideoCodec: 'hevc', AudioCodec: 'ac3' }], true]);
  });

  test('if the server refuses direct play, a stream nobody checked is never copied into its HLS output: only the targets are listed (it copies the stream only if its codec is one of them)', () => {
    const { deviceProfile, options } = buildPlaybackRequest(attempt(), hevcMkv(), RENDERERS);

    expect(deviceProfile.TranscodingProfiles?.[0]).toMatchObject({ VideoCodec: 'h264,vp9', AudioCodec: 'aac,opus,ac3' });
    expect(options).toMatchObject({ EnableTranscoding: true, AllowVideoStreamCopy: true, AllowAudioStreamCopy: true });
  });

  test('both streams unchecked: both lists hold only the targets', () => {
    const { deviceProfile } = buildPlaybackRequest(attempt({ audio: { index: 1, action: 'copy', fallback: [aac, opus], unverified: true } }), hevcMkv(), RENDERERS);

    expect(deviceProfile.TranscodingProfiles?.[0]).toMatchObject({ VideoCodec: 'h264,vp9', AudioCodec: 'aac,opus' });
  });

  test('an unchecked stream without a decodable target leaves the server no fallback: an empty list would mean "anything"', () => {
    const { deviceProfile, options } = buildPlaybackRequest(attempt({ video: { index: 0, action: 'copy', unverified: true } }), hevcMkv(), RENDERERS);

    expect([deviceProfile.TranscodingProfiles, options.EnableTranscoding, options.EnableDirectPlay]).toEqual([[], false, true]);
  });

  test('a remux copies its unchecked streams, as planned: their source codec is listed', () => {
    const remux = verdict('Remux', { unverified: true, reasons: ['SecondaryAudioTrack', 'Unverified'], video: { index: 0, action: 'copy', fallback: [h264, vp9], unverified: true } });
    const { deviceProfile } = buildPlaybackRequest(remux, hevcMkv(), RENDERERS);

    expect(deviceProfile.TranscodingProfiles?.[0]).toMatchObject({ VideoCodec: 'h264,vp9,hevc' });
  });

  test('music: the server takes a single codec, so its fallback for an unchecked track is the preferred target', () => {
    const track = mediaSource([audioStream({ Index: 0, Codec: 'alac', CodecTag: 'alac' })], { Container: 'm4a', Bitrate: 900_000 });
    const song = { ...verdict('DirectPlay'), unverified: true, video: undefined, audio: { index: 0, action: 'copy' as const, fallback: [aac, opus], unverified: true as const } };
    const { deviceProfile } = buildPlaybackRequest(song, track, RENDERERS);

    expect(deviceProfile.DirectPlayProfiles).toEqual([{ Type: 'Audio', Container: 'm4a', AudioCodec: 'alac' }]);
    expect(deviceProfile.TranscodingProfiles?.[0]).toMatchObject({ Type: 'Audio', AudioCodec: 'aac' });
  });
});

describe('the streaming bitrate when the video is copied', () => {
  /**
   * Measured on Jellyfin 12.4: the server gives a copied video the streaming bitrate minus the audio's, and encodes the
   * video when that is below the video stream's bitrate, without a reason. With the source's bitrate as the limit, an
   * audio transcode of HEVC (3147323 b/s) + AC-3 5.1 (384 kbit/s) in a 3531323 b/s source got VideoBitrate=2891323
   * (the AAC 5.1 encode takes 640 kbit/s) and the video was encoded to H.264.
   */
  test.each(['DirectPlay', 'Remux', 'TranscodeAudio'] as const)('%s: no limit, even with the source\'s bitrate known (the audio the server encodes may take more than the source\'s)', (method) => {
    const plan = method === 'TranscodeAudio' ? transcodeAudio : verdict(method);
    const { deviceProfile, options } = buildPlaybackRequest(plan, hevcMkv(), RENDERERS);

    expect([options.MaxStreamingBitrate, deviceProfile.MaxStreamingBitrate]).toEqual([UNLIMITED_STREAMING_BITRATE, UNLIMITED_STREAMING_BITRATE]);
  });
});

describe('the streaming bitrate when the source has none', () => {
  /**
   * Measured on Jellyfin 12.4: the server holds a copied stream to the limit (a 59 Mbit/s remote file remuxed under
   * 40 Mbit/s was encoded), and its own fallback encode needs a value to size the video (with null an AVI it could not
   * copy came out at 416x234 instead of 640x360)
   */
  test.each(['DirectPlay', 'Remux', 'TranscodeAudio'] as const)('%s: no limit in practice, in the options and the profile, since nothing is known to stay under', (method) => {
    const plan = method === 'TranscodeAudio' ? transcodeAudio : verdict(method);
    const { deviceProfile, options } = buildPlaybackRequest(plan, hevcMkv({ Bitrate: undefined }), RENDERERS);

    expect([options.MaxStreamingBitrate, deviceProfile.MaxStreamingBitrate]).toEqual([UNLIMITED_STREAMING_BITRATE, UNLIMITED_STREAMING_BITRATE]);
  });

  test('a video transcode keeps the cap of its quality level', () => {
    const { deviceProfile, options } = buildPlaybackRequest(transcodeVideo, hevcMkv({ Bitrate: undefined }), RENDERERS);

    expect([options.MaxStreamingBitrate, deviceProfile.MaxStreamingBitrate]).toEqual([5_000_000, 5_000_000]);
  });
});

describe('remux', () => {
  const { deviceProfile, options } = buildPlaybackRequest(verdict('Remux'), hevcMkv(), RENDERERS);

  test('no direct play profile and direct play disabled', () => {
    expect([deviceProfile.DirectPlayProfiles, options.EnableDirectPlay]).toEqual([[], false]);
  });

  test('progressive direct stream is disabled, so the remux goes through HLS', () => {
    expect(options.EnableDirectStream).toBe(false);
  });

  test('one HLS transcoding profile in fragmented MP4 whose lists contain the source codecs, so they are copied, after the targets, so a stream the server refuses to copy is encoded to a codec the browser decodes', () => {
    expect(deviceProfile.TranscodingProfiles).toEqual([{
      Type: 'Video',
      Context: 'Streaming',
      Protocol: 'hls',
      Container: 'mp4',
      VideoCodec: 'h264,vp9,hevc',
      AudioCodec: 'aac,opus,ac3'
    }]);
  });

  test('a copied stream without decodable targets lists only its source codec', () => {
    const request = buildPlaybackRequest(verdict('Remux', { video: { index: 0, action: 'copy' }, audio: { index: 1, action: 'copy', fallback: [] } }), hevcMkv(), RENDERERS);

    expect(request.deviceProfile.TranscodingProfiles?.[0]).toMatchObject({ VideoCodec: 'hevc', AudioCodec: 'ac3' });
  });

  test('a source codec that is also a target is listed once, in the target\'s place', () => {
    const source = mediaSource([videoStream({ Index: 0, Codec: 'h264' }), audioStream({ Index: 1, Codec: 'aac' })], { Container: 'mkv' });
    const request = buildPlaybackRequest(verdict('Remux'), source, RENDERERS);

    expect(request.deviceProfile.TranscodingProfiles?.[0]).toMatchObject({ VideoCodec: 'h264,vp9', AudioCodec: 'aac,opus' });
  });

  test('both streams may be copied', () => {
    expect(options).toMatchObject({ EnableTranscoding: true, AllowVideoStreamCopy: true, AllowAudioStreamCopy: true });
  });

  test('no channel cap: the audio is copied as it is', () => {
    expect(options.MaxAudioChannels).toBeUndefined();
  });
});

describe('audio transcode', () => {
  const { deviceProfile, options } = buildPlaybackRequest(transcodeAudio, hevcMkv(), RENDERERS);
  const [profile] = deviceProfile.TranscodingProfiles ?? [];

  test('the video codec list has the source codec (copied) after its targets, the audio list only the targets, in order', () => {
    expect(profile).toMatchObject({ VideoCodec: 'h264,vp9,hevc', AudioCodec: 'aac,opus' });
  });

  test('the audio may not be copied, the video may', () => {
    expect(options).toMatchObject({ AllowVideoStreamCopy: true, AllowAudioStreamCopy: false, EnableDirectPlay: false });
  });

  test('the channel cap of the verdict is sent', () => {
    expect([options.MaxAudioChannels, profile?.MaxAudioChannels]).toEqual([6, '6']);
  });

  /**
   * Without a streaming limit (the video is copied) Jellyfin 12.4 encodes AAC 5.1 at its own default, 640 kbit/s, where
   * the limit of the source's bitrate made it 384 kbit/s (measured with case d: AC-3 5.1 at 384 kbit/s). A condition on
   * each audio target caps the encode at the source audio's bitrate and leaves the copied video alone (measured).
   */
  test('the encoded audio is capped at the source audio\'s bitrate, through a condition on each target, which only the encode meets', () => {
    expect(deviceProfile.CodecProfiles).toEqual(['aac', 'opus'].map(codec => ({
      Type: 'VideoAudio',
      Codec: codec,
      Conditions: [{ Condition: 'LessThanEqual', Property: 'AudioBitrate', Value: '128053', IsRequired: false }]
    })));
  });

  test('without the source audio\'s bitrate there is nothing to cap it with', () => {
    const source = hevcMkv();
    const withoutBitrate = { ...source, MediaStreams: source.MediaStreams?.map(stream => stream.Type === 'Audio' ? { ...stream, BitRate: undefined } : stream) };

    expect(buildPlaybackRequest(transcodeAudio, withoutBitrate, RENDERERS).deviceProfile.CodecProfiles).toEqual([]);
  });

  test.each([0, -1])('a source audio bitrate of %i is unknown: nothing to cap it with either', (bitrate) => {
    const source = hevcMkv();
    const unknownBitrate = { ...source, MediaStreams: source.MediaStreams?.map(stream => stream.Type === 'Audio' ? { ...stream, BitRate: bitrate } : stream) };

    expect(buildPlaybackRequest(transcodeAudio, unknownBitrate, RENDERERS).deviceProfile.CodecProfiles).toEqual([]);
  });

  test('a video transcode keeps sizing the encoded audio by its streaming cap, as before: no audio condition', () => {
    const { deviceProfile: profileOfBoth } = buildPlaybackRequest(transcodeBoth, hevcMkv(), RENDERERS);

    expect(profileOfBoth.CodecProfiles?.filter(codecProfile => codecProfile.Type !== 'Video')).toEqual([]);
  });
});

describe('video transcode', () => {
  const { deviceProfile, options } = buildPlaybackRequest(transcodeVideo, hevcMkv(), RENDERERS);
  const [profile] = deviceProfile.TranscodingProfiles ?? [];

  test('the source video codec is absent from the list, which holds only the targets, in order', () => {
    expect(profile?.VideoCodec).toBe('h264,vp9');
  });

  test('the audio is copied when the verdict copies it: its codec is in the list, after its targets', () => {
    expect([profile?.AudioCodec, options.AllowAudioStreamCopy]).toEqual(['aac,opus,ac3', true]);
  });

  test('the video may not be copied', () => {
    expect(options.AllowVideoStreamCopy).toBe(false);
  });

  test('every target is limited to SDR, 8 bit and the quality cap', () => {
    const expected: ProfileCondition[] = [
      { Condition: 'EqualsAny', Property: 'VideoRangeType', Value: 'SDR', IsRequired: false },
      { Condition: 'LessThanEqual', Property: 'VideoBitDepth', Value: '8', IsRequired: false },
      { Condition: 'LessThanEqual', Property: 'Width', Value: '1280', IsRequired: false },
      { Condition: 'LessThanEqual', Property: 'Height', Value: '720', IsRequired: false },
      { Condition: 'LessThanEqual', Property: 'VideoBitrate', Value: '5000000', IsRequired: false }
    ];

    expect(deviceProfile.CodecProfiles).toEqual([
      { Type: 'Video', Codec: 'h264', Conditions: expected },
      { Type: 'Video', Codec: 'vp9', Conditions: expected }
    ]);
  });

  test('the streaming bitrate is the cap\'s', () => {
    expect(options.MaxStreamingBitrate).toBe(5_000_000);
  });

  test('when the audio is encoded too, its list holds only the targets and copy is not allowed', () => {
    const request = buildPlaybackRequest(transcodeBoth, hevcMkv(), RENDERERS);

    expect([request.deviceProfile.TranscodingProfiles?.[0]?.AudioCodec, request.options.AllowAudioStreamCopy, request.options.MaxAudioChannels])
      .toEqual(['aac', false, 2]);
  });
});

describe('stream indexes and subtitles', () => {
  test('the selected audio and subtitle are sent by absolute index, with the media source id', () => {
    const { options } = buildPlaybackRequest(verdict('DirectPlay', { subtitle: { index: 2, class: 'server-text', delivery: 'External' } }), hevcMkv(), RENDERERS);

    expect(options).toMatchObject({ AudioStreamIndex: 1, SubtitleStreamIndex: 2, MediaSourceId: 'source-id' });
  });

  test('without a subtitle, -1 is sent so the server does not pick one', () => {
    const { options } = buildPlaybackRequest(verdict('DirectPlay'), hevcMkv(), RENDERERS);

    expect(options.SubtitleStreamIndex).toBe(-1);
  });

  test('a burn-in subtitle is sent like any other: the server burns it because no profile delivers it', () => {
    const request = buildPlaybackRequest({ ...transcodeVideo, subtitle: { index: 3, class: 'burn-in', delivery: 'Encode' } }, hevcMkv(), RENDERERS);
    const formats = request.deviceProfile.SubtitleProfiles?.map(profile => profile.Format);

    expect([request.options.SubtitleStreamIndex, formats?.includes('dvdsub')]).toEqual([3, false]);
  });

  test('the subtitle profiles are the external ones of the renderer registry', () => {
    const { deviceProfile } = buildPlaybackRequest(verdict('DirectPlay'), hevcMkv(), RENDERERS);
    const methods = new Set(deviceProfile.SubtitleProfiles?.map(profile => profile.Method));

    expect([...methods]).toEqual(['External']);
  });
});

describe('Dolby Vision without a compatible base layer', () => {
  const dovi = (): MediaSourceInfo => mediaSource([
    videoStream({ Codec: 'hevc', CodecTag: 'dvh1', VideoRange: 'HDR', VideoRangeType: 'DOVI', DvProfile: 5, DvLevel: 6 }),
    audioStream()
  ]);

  test('when the video is copied, the client declares Dolby Vision so the server keeps it as such', () => {
    const { deviceProfile } = buildPlaybackRequest(verdict('Remux'), dovi(), RENDERERS);

    expect(deviceProfile.CodecProfiles).toEqual([{
      Type: 'Video',
      Codec: 'hevc',
      Conditions: [{ Condition: 'EqualsAny', Property: 'VideoRangeType', Value: 'DOVI', IsRequired: false }]
    }]);
  });

  test('other video declares nothing when copied', () => {
    const { deviceProfile } = buildPlaybackRequest(verdict('Remux'), hevcMkv(), RENDERERS);

    expect(deviceProfile.CodecProfiles).toEqual([]);
  });
});

describe('music uses audio profiles', () => {
  const track = mediaSource([audioStream({ Index: 0, Codec: 'flac', CodecTag: undefined })], { Container: 'flac', Bitrate: 900_000 });

  test('direct play', () => {
    const { deviceProfile } = buildPlaybackRequest(
      { ...verdict('DirectPlay'), video: undefined, audio: { index: 0, action: 'copy' } },
      track,
      RENDERERS
    );

    expect(deviceProfile.DirectPlayProfiles).toEqual([{ Type: 'Audio', Container: 'flac', AudioCodec: 'flac' }]);
  });

  test('remux: only the source codec, even with targets: the server skips a profile with a list for pure audio', () => {
    const { deviceProfile } = buildPlaybackRequest(
      { ...verdict('Remux'), video: undefined, audio: { index: 0, action: 'copy', fallback: [aac, opus] } },
      track,
      RENDERERS
    );

    expect(deviceProfile.TranscodingProfiles?.[0]?.AudioCodec).toBe('flac');
  });

  test('audio transcode', () => {
    const { deviceProfile } = buildPlaybackRequest(
      { ...verdict('TranscodeAudio'), video: undefined, audio: { index: 0, action: 'transcode', targets: [aac] }, maxAudioChannels: 2 },
      track,
      RENDERERS
    );

    expect(deviceProfile.TranscodingProfiles).toEqual([
      { Type: 'Audio', Context: 'Streaming', Protocol: 'hls', Container: 'mp4', AudioCodec: 'aac', MaxAudioChannels: '2' }
    ]);
    // Measured: the server encodes music at the same bitrate with or without a streaming limit (ALAC: AAC 128 kbit/s)
    expect(deviceProfile.CodecProfiles).toEqual([]);
  });

  test('an audio transcode names only the preferred target: the server skips a profile with a list for pure audio', () => {
    const { deviceProfile } = buildPlaybackRequest(
      { ...verdict('TranscodeAudio'), video: undefined, audio: { index: 0, action: 'transcode', targets: [aac, opus] }, maxAudioChannels: 6 },
      track,
      RENDERERS
    );

    expect(deviceProfile.TranscodingProfiles?.[0]?.AudioCodec).toBe('aac');
  });

  test('the audio of a video keeps every target in order, since the server takes a list there', () => {
    const { deviceProfile } = buildPlaybackRequest(transcodeAudio, hevcMkv(), RENDERERS);

    expect(deviceProfile.TranscodingProfiles?.[0]?.AudioCodec).toBe('aac,opus');
  });
});

/**
 * Measured on Jellyfin 12.4 with an AAC-only MP4 and an AC-3-only Matroska in a movie library (MediaType Video): with
 * Audio profiles the server offered neither direct play nor a transcoding URL; with Video profiles it streamed them
 * through HLS (it never plays a video item without a video stream directly: VideoCodecNotSupported)
 */
describe('a video item without a video stream (an audio-only file in a video library) is requested as a video', () => {
  const audioOnly = mediaSource([audioStream({ Index: 0 })], { Container: 'mp4' });

  test('direct play', () => {
    const { deviceProfile } = buildPlaybackRequest(
      { ...verdict('DirectPlay'), mediaType: 'Video', video: undefined, audio: { index: 0, action: 'copy', fallback: [aac, opus] } },
      audioOnly,
      RENDERERS
    );

    expect([deviceProfile.DirectPlayProfiles?.[0]?.Type, deviceProfile.TranscodingProfiles?.[0]?.Type]).toEqual(['Video', 'Video']);
  });

  test('audio transcode: a video profile, which takes a list of codecs like any video\'s', () => {
    const { deviceProfile } = buildPlaybackRequest(
      { ...verdict('TranscodeAudio'), mediaType: 'Video', video: undefined, audio: { index: 0, action: 'transcode', targets: [aac, opus] }, maxAudioChannels: 6 },
      audioOnly,
      RENDERERS
    );

    expect(deviceProfile.TranscodingProfiles).toEqual([
      { Type: 'Video', Context: 'Streaming', Protocol: 'hls', Container: 'mp4', AudioCodec: 'aac,opus', MaxAudioChannels: '6' }
    ]);
  });

  test('without the media type, a verdict without video is music', () => {
    const { deviceProfile } = buildPlaybackRequest({ ...verdict('DirectPlay'), video: undefined, audio: { index: 0, action: 'copy' } }, audioOnly, RENDERERS);

    expect(deviceProfile.DirectPlayProfiles?.[0]?.Type).toBe('Audio');
  });
});

describe('an unplayable verdict', () => {
  test('asks for nothing: everything is disabled', () => {
    const { options } = buildPlaybackRequest(verdict('Unplayable'), hevcMkv(), RENDERERS);

    expect(options).toMatchObject({ EnableDirectPlay: false, EnableTranscoding: false });
  });
});

describe('a source without stream metadata (live TV, .strm, remote): the server decides what nobody else knows', () => {
  /**
   * A .strm item as Jellyfin 12.4 reports it in /Items: no streams and the .strm file's own extension as the container
   */
  const strm = (): MediaSourceInfo => mediaSource([], { Container: 'strm', Protocol: 'Http', IsRemote: true, MediaStreams: [], Bitrate: undefined });
  const blind = (method: PlaybackMethod, extra: Partial<Verdict> = {}): Verdict => verdict(method, {
    reasons: ['Unverified'],
    unverified: true,
    signature: 'unverified:source-id',
    quality: {},
    video: { action: 'copy', fallback: [h264, vp9] },
    audio: { action: 'copy', fallback: [aac, opus] },
    ...extra
  });

  test('blind direct play: one direct play profile with nothing to restrict it to, not even the container (a .strm reports its own extension, which never matches the container the server finds when it opens the source)', () => {
    const { deviceProfile, options } = buildPlaybackRequest(blind('DirectPlay'), strm(), RENDERERS);

    expect([deviceProfile.DirectPlayProfiles, options.EnableDirectPlay]).toEqual([[{ Type: 'Video', Container: '' }], true]);
  });

  test('blind direct play keeps the server\'s fallback: the targets, which it copies if the source has them and encodes to otherwise', () => {
    const { deviceProfile, options } = buildPlaybackRequest(blind('DirectPlay'), strm(), RENDERERS);

    expect(deviceProfile.TranscodingProfiles).toEqual([expect.objectContaining({ Type: 'Video', Protocol: 'hls', VideoCodec: 'h264,vp9', AudioCodec: 'aac,opus' })]);
    expect(options).toMatchObject({ EnableTranscoding: true, AllowVideoStreamCopy: true, AllowAudioStreamCopy: true });
  });

  test('no audio index is sent: no stream is known', () => {
    const { options } = buildPlaybackRequest(blind('TranscodeAudio', { audio: { action: 'transcode', targets: [aac, opus] } }), strm(), RENDERERS);

    expect('AudioStreamIndex' in options && options.AudioStreamIndex !== undefined).toBe(false);
  });

  test('without a target for a stream nobody knows, there is no fallback: an empty codec list would mean "anything"', () => {
    const { deviceProfile, options } = buildPlaybackRequest(blind('DirectPlay', { video: { action: 'copy' }, audio: { action: 'copy' } }), strm(), RENDERERS);

    expect([deviceProfile.TranscodingProfiles, options.EnableTranscoding, options.EnableDirectPlay]).toEqual([[], false, true]);
  });

  test('a remux lists the targets with copy allowed, so the server copies the streams it can carry and encodes the rest', () => {
    const { deviceProfile, options } = buildPlaybackRequest(blind('Remux'), strm(), RENDERERS);

    expect(deviceProfile.DirectPlayProfiles).toEqual([]);
    expect(deviceProfile.TranscodingProfiles?.[0]).toMatchObject({ VideoCodec: 'h264,vp9', AudioCodec: 'aac,opus' });
    expect(options).toMatchObject({ EnableDirectPlay: false, EnableTranscoding: true, AllowVideoStreamCopy: true, AllowAudioStreamCopy: true });
  });

  test('a video transcode encodes both streams at the quality cap', () => {
    const { deviceProfile, options } = buildPlaybackRequest(blind('TranscodeVideo', {
      video: { action: 'transcode', targets: [h264, vp9] },
      audio: { action: 'transcode', targets: [aac, opus] },
      maxAudioChannels: 6,
      qualityCap: { maxBitrate: 40_000_000, maxWidth: 3840, maxHeight: 2160 }
    }), strm(), RENDERERS);

    expect(deviceProfile.TranscodingProfiles?.[0]).toMatchObject({ VideoCodec: 'h264,vp9', AudioCodec: 'aac,opus', MaxAudioChannels: '6' });
    expect(deviceProfile.CodecProfiles?.map(profile => profile.Codec)).toEqual(['h264', 'vp9']);
    expect(options).toMatchObject({ AllowVideoStreamCopy: false, AllowAudioStreamCopy: false, MaxStreamingBitrate: 40_000_000 });
  });

  test('nothing is known of its bitrate either: a direct play or a remux sets no limit, which the server would enforce on the streams it copies', () => {
    const requests = [blind('DirectPlay'), blind('Remux')].map(plan => buildPlaybackRequest(plan, strm(), RENDERERS));

    expect(requests.map(({ deviceProfile, options }) => [options.MaxStreamingBitrate, deviceProfile.MaxStreamingBitrate]))
      .toEqual([[UNLIMITED_STREAMING_BITRATE, UNLIMITED_STREAMING_BITRATE], [UNLIMITED_STREAMING_BITRATE, UNLIMITED_STREAMING_BITRATE]]);
  });

  test('an audio item gets an audio profile: the server only matches direct play profiles of the item\'s type', () => {
    const { deviceProfile } = buildPlaybackRequest(blind('DirectPlay', { video: undefined, audio: { action: 'copy' } }), strm(), RENDERERS);

    expect(deviceProfile.DirectPlayProfiles).toEqual([{ Type: 'Audio', Container: '' }]);
  });
});

/**
 * A negotiated source as PlaybackInfo returns it
 */
function negotiated(extra: Partial<MediaSourceInfo>, streams: MediaStream[] = hevcMkv().MediaStreams ?? []): MediaSourceInfo {
  return { ...hevcMkv(), MediaStreams: streams, SupportsDirectPlay: false, ...extra };
}

const hls = (query: string) => `/videos/item/master.m3u8?DeviceId=d&MediaSourceId=source-id&${query}&ApiKey=secret`;

describe('deriveActualMethod: what the server actually chose', () => {
  const cases: [string, Partial<MediaSourceInfo>, PlaybackMethod][] = [
    ['SupportsDirectPlay means direct play', { SupportsDirectPlay: true, TranscodingUrl: undefined }, 'DirectPlay'],
    ['no direct play and no transcoding URL means unplayable', { TranscodingUrl: undefined }, 'Unplayable'],
    ['both source codecs listed and copy allowed means remux', { TranscodingUrl: hls('VideoCodec=hevc&AudioCodec=ac3&AudioStreamIndex=1') }, 'Remux'],
    ['a container reason alone is still a remux', { TranscodingUrl: hls('VideoCodec=hevc&AudioCodec=ac3&AudioStreamIndex=1&TranscodeReasons=ContainerNotSupported') }, 'Remux'],
    ['the source audio codec missing from the list means audio transcode', { TranscodingUrl: hls('VideoCodec=hevc&AudioCodec=aac&AudioStreamIndex=1&TranscodeReasons=AudioCodecNotSupported') }, 'TranscodeAudio'],
    ['audio copy forbidden means audio transcode', { TranscodingUrl: hls('VideoCodec=hevc&AudioCodec=ac3,aac&AudioStreamIndex=1&allowAudioStreamCopy=false') }, 'TranscodeAudio'],
    ['an audio channel reason means audio transcode', { TranscodingUrl: hls('VideoCodec=hevc&AudioCodec=ac3&AudioStreamIndex=1&TranscodeReasons=AudioChannelsNotSupported') }, 'TranscodeAudio'],
    ['a secondary audio reason alone is a remux', { TranscodingUrl: hls('VideoCodec=hevc&AudioCodec=ac3&AudioStreamIndex=1&TranscodeReasons=SecondaryAudioNotSupported') }, 'Remux'],
    ['the source video codec missing from the list means video transcode', { TranscodingUrl: hls('VideoCodec=h264&AudioCodec=ac3&AudioStreamIndex=1&TranscodeReasons=VideoCodecNotSupported') }, 'TranscodeVideo'],
    ['video copy forbidden means video transcode', { TranscodingUrl: hls('VideoCodec=hevc&AudioCodec=ac3&AudioStreamIndex=1&allowVideoStreamCopy=false') }, 'TranscodeVideo'],
    ['a video resolution reason means video transcode', { TranscodingUrl: hls('VideoCodec=hevc&AudioCodec=ac3&AudioStreamIndex=1&TranscodeReasons=VideoResolutionNotSupported') }, 'TranscodeVideo'],
    ['a bitrate limit means video transcode', { TranscodingUrl: hls('VideoCodec=hevc&AudioCodec=ac3&AudioStreamIndex=1&TranscodeReasons=ContainerBitrateExceedsLimit') }, 'TranscodeVideo'],
    ['a burnt-in subtitle means video transcode', { TranscodingUrl: hls('VideoCodec=hevc&AudioCodec=ac3&AudioStreamIndex=1&SubtitleStreamIndex=3&SubtitleMethod=Encode') }, 'TranscodeVideo'],
    // Jellyfin 12.4 adds SubtitleMethod=Encode whenever a subtitle index is requested, even -1 (measured)
    ['SubtitleMethod=Encode without a subtitle index is not a burn-in', { TranscodingUrl: hls('VideoCodec=hevc&AudioCodec=ac3&AudioStreamIndex=1&SubtitleMethod=Encode') }, 'Remux'],
    // DirectPlayError is what the server reports when no direct play profile was offered (measured)
    ['DirectPlayError alone is a remux', { TranscodingUrl: hls('VideoCodec=hevc&AudioCodec=ac3&AudioStreamIndex=1&TranscodeReasons=DirectPlayError') }, 'Remux'],
    ['video and audio both encoded is a video transcode', { TranscodingUrl: hls('VideoCodec=h264&AudioCodec=aac&AudioStreamIndex=1') }, 'TranscodeVideo'],
    ['query parameter names are compared case-insensitively', { TranscodingUrl: hls('videocodec=hevc&audiocodec=aac&audiostreamindex=1') }, 'TranscodeAudio'],
    ['codec names are compared case-insensitively', { TranscodingUrl: hls('VideoCodec=HEVC&AudioCodec=AC3&AudioStreamIndex=1') }, 'Remux'],
    // Real Jellyfin 12.4 answers to the lists with targets ahead of the source codecs (the server copied both)
    ['the source codecs after the targets, without encode reasons, is a remux', { TranscodingUrl: hls('VideoCodec=h264,vp9,hevc&AudioCodec=ac3&AudioStreamIndex=1&TranscodeReasons=DirectPlayError') }, 'Remux'],
    // (the server encoded the video to H.264 and copied the audio)
    ['the source codecs after the targets with a bitrate limit is a video transcode', { TranscodingUrl: hls('VideoCodec=h264,hevc&AudioCodec=aac,ac3&AudioStreamIndex=1&TranscodeReasons=ContainerBitrateExceedsLimit') }, 'TranscodeVideo'],
    // (the server encoded the audio to AAC and copied the video)
    ['the source video codec after its targets with the audio targets alone is an audio transcode', { TranscodingUrl: hls('VideoCodec=h264,hevc&AudioCodec=aac,opus&AudioStreamIndex=1&TranscodeReasons=AudioCodecNotSupported,DirectPlayError&allowAudioStreamCopy=false') }, 'TranscodeAudio']
  ];

  test.each(cases)('%s', (_, extra, expected) => {
    const method = deriveActualMethod(negotiated(extra));

    expect(method).toBe(expected);
  });

  describe('the audio bitrate the server allows a copied stream of a video', () => {
    /**
     * Real Jellyfin 12.4 answers: the server caps the audio bitrate by the total bitrate and re-encodes a copied
     * stream above the cap, while the URL keeps its codec and gives no reason (it encoded FLAC 960 kbit/s and
     * DTS 768 kbit/s to AAC 384 kbit/s)
     */
    const streams = (audio: Partial<MediaStream>) => [videoStream({ Codec: 'hevc', CodecTag: undefined }), audioStream({ CodecTag: undefined, ...audio })];
    const url = (audioCodec: string) => hls(`VideoCodec=h264,av1,vp9,hevc&AudioCodec=${audioCodec}&AudioStreamIndex=1&VideoBitrate=1144167&AudioBitrate=384000&TranscodeReasons=DirectPlayError`);

    test('above it, the audio is encoded although its codec is listed', () => {
      const method = deriveActualMethod(negotiated({ TranscodingUrl: url('flac') }, streams({ Codec: 'flac', BitRate: 960_000 })));

      expect(method).toBe('TranscodeAudio');
    });

    test('at it, the audio is copied', () => {
      const method = deriveActualMethod(negotiated({ TranscodingUrl: url('ac3') }, streams({ Codec: 'ac3', Channels: 6, BitRate: 384_000 })));

      expect(method).toBe('Remux');
    });

    test('without the source\'s bitrate nothing can be concluded from it', () => {
      const method = deriveActualMethod(negotiated({ TranscodingUrl: url('flac') }, streams({ Codec: 'flac', BitRate: undefined })));

      expect(method).toBe('Remux');
    });
  });

  describe('limits the server puts on a copied video', () => {
    /**
     * Real Jellyfin 12.4 answers to remux requests (copy allowed, the source codec listed): the URL keeps the source
     * codec and reports only DirectPlayError, while ffmpeg encodes the video (the session reports IsVideoDirect false
     * and the segments are H.264 High 8-bit)
     */
    const streams = (video: Partial<MediaStream>) => [videoStream({ CodecTag: undefined, ...video }), audioStream({ CodecTag: undefined })];
    const url = (extra: string) => hls(`VideoCodec=h264,av1,vp9,h264&AudioCodec=aac,opus,aac&AudioStreamIndex=1&TranscodeReasons=DirectPlayError&${extra}`);

    test('a video bitrate below the stream\'s means the video is encoded (a 59 Mbit/s remote file under a 40 Mbit/s limit)', () => {
      const method = deriveActualMethod(negotiated({ TranscodingUrl: url('VideoBitrate=39871989') }, streams({ BitRate: 59_251_161 })));

      expect(method).toBe('TranscodeVideo');
    });

    test('a video bitrate at the stream\'s means the video is copied', () => {
      const method = deriveActualMethod(negotiated({ TranscodingUrl: url('VideoBitrate=732357') }, streams({ BitRate: 732_357 })));

      expect(method).toBe('Remux');
    });

    test('without the stream\'s bitrate nothing can be concluded from it', () => {
      const method = deriveActualMethod(negotiated({ TranscodingUrl: url('VideoBitrate=732357') }, streams({ BitRate: undefined })));

      expect(method).toBe('Remux');
    });

    test('a bit depth limit of the source codec below the stream\'s means the video is encoded (10-bit H.264 under h264-videobitdepth=8)', () => {
      const method = deriveActualMethod(negotiated({ TranscodingUrl: url('h264-videobitdepth=8') }, streams({ BitDepth: 10, Profile: 'High 10' })));

      expect(method).toBe('TranscodeVideo');
    });

    test('the server states the source\'s own bit depth for its codec on a copy: that is not a limit', () => {
      const method = deriveActualMethod(negotiated({ TranscodingUrl: url('h264-videobitdepth=10&h264-profile=high10') }, streams({ BitDepth: 10, Profile: 'High 10' })));

      expect(method).toBe('Remux');
    });

    test('a bit depth limit of another codec (a target) does not concern the copied stream', () => {
      const method = deriveActualMethod(negotiated({ TranscodingUrl: url('vp9-videobitdepth=8') }, streams({ BitDepth: 10, Profile: 'High 10' })));

      expect(method).toBe('Remux');
    });
  });

  test('music: the source codec missing from the audio list means audio transcode', () => {
    const track = [audioStream({ Index: 0, Codec: 'flac', CodecTag: undefined })];
    const method = deriveActualMethod(negotiated({ TranscodingUrl: '/audio/item/master.m3u8?AudioCodec=aac&AudioStreamIndex=0' }, track));

    expect(method).toBe('TranscodeAudio');
  });

  test('music: video reasons the server reports for audio items are ignored, and without any audio index the only audio stream is compared', () => {
    const track = [audioStream({ Index: 0, Codec: 'flac', CodecTag: undefined })];
    // Real Jellyfin 12.4 answer for a FLAC track transcoded to AAC: no AudioStreamIndex in the URL, no default index
    const url = '/audio/item/master.m3u8?MediaSourceId=x&AudioCodec=aac&SegmentContainer=mp4&TranscodeReasons=ContainerNotSupported,VideoCodecNotSupported,AudioCodecNotSupported&allowAudioStreamCopy=false';
    const method = deriveActualMethod(negotiated({ TranscodingUrl: url, DefaultAudioStreamIndex: undefined }, track));

    expect(method).toBe('TranscodeAudio');
  });

  test('music: the reasons say why direct play failed, not whether the audio is copied (a FLAC copy lists AudioCodecNotSupported too)', () => {
    const track = [audioStream({ Index: 0, Codec: 'flac', CodecTag: undefined })];
    // Real Jellyfin 12.4 answer for a FLAC track remuxed to HLS: the server copied FLAC (checked in the init segment)
    const url = '/audio/item/master.m3u8?MediaSourceId=x&AudioCodec=flac&SegmentContainer=mp4&TranscodeReasons=ContainerNotSupported,VideoCodecNotSupported,AudioCodecNotSupported';
    const method = deriveActualMethod(negotiated({ TranscodingUrl: url, DefaultAudioStreamIndex: undefined }, track));

    expect(method).toBe('Remux');
  });

  test('without an audio index in the URL, the source\'s default audio stream is the one compared', () => {
    const method = deriveActualMethod(negotiated({ TranscodingUrl: hls('VideoCodec=hevc&AudioCodec=ac3'), DefaultAudioStreamIndex: 1 }));

    expect(method).toBe('Remux');
  });
});
