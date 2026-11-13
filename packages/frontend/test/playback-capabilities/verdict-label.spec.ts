import { describe, expect, test } from 'vitest';
import { audioStream, mediaSource, subtitleStream, videoStream } from './fixtures.ts';
import type { PlaybackMethod, StreamPlan, Verdict, VerdictReason } from '#/utils/playback-capabilities/verdict.ts';
import { getMethodChange, getVerdictLabel } from '#/utils/playback-capabilities/verdict-label.ts';

/**
 * Case d of the test library: HEVC + AC-3 in MKV
 */
const hevcAc3Mkv = mediaSource(
  [videoStream({ Index: 0, Codec: 'hevc', CodecTag: undefined }), audioStream({ Index: 1, Codec: 'ac3', CodecTag: undefined, Channels: 6 })],
  { Container: 'mkv' }
);

/**
 * Case j1/k-like: H.264 + AAC (eng) + Opus (spa), a text and a bitmap subtitle, in MKV
 */
const tracksMkv = mediaSource(
  [
    videoStream({ Index: 0 }),
    audioStream({ Index: 1 }),
    audioStream({ Index: 2, Codec: 'opus', IsDefault: false }),
    subtitleStream('subrip', true, { Index: 3 }),
    subtitleStream('DVDSUB', false, { Index: 4 })
  ],
  { Container: 'mkv' }
);

const copy = (index: number): StreamPlan => ({ index, action: 'copy' });
const encode = (index: number): StreamPlan => ({ index, action: 'transcode', targets: [{ codec: 'h264', codecString: 'avc1.640028' }] });

/**
 * A verdict with only what the label looks at. Plans copy both streams of `hevcAc3Mkv` unless given.
 */
function verdict(method: PlaybackMethod, reasons: VerdictReason[], plans: { video?: StreamPlan; audio?: StreamPlan } = {}): Verdict {
  const playable = method !== 'Unplayable';

  return {
    method,
    reasons,
    smooth: !reasons.includes('NotSmooth'),
    unverified: reasons.includes('Unverified'),
    video: plans.video ?? (playable ? copy(0) : undefined),
    audio: plans.audio ?? (playable ? copy(1) : undefined),
    signature: '',
    quality: {}
  };
}

describe('each method in words, without a reason when nothing explains it', () => {
  test.each<[PlaybackMethod, string]>([
    ['DirectPlay', 'DirectPlay'],
    ['Remux', 'Remux'],
    ['TranscodeAudio', 'TranscodeAudio'],
    ['TranscodeVideo', 'TranscodeVideo'],
    ['Unplayable', 'Unplayable']
  ])('%s', (method, expected) => {
    const label = getVerdictLabel(verdict(method, []), hevcAc3Mkv);

    expect(label).toEqual({ method: expected });
  });

  test('a video transcode that also encodes the audio says both', () => {
    const label = getVerdictLabel(verdict('TranscodeVideo', ['SubtitleBurnIn'], { video: encode(0), audio: encode(1) }), hevcAc3Mkv);

    expect(label.method).toBe('TranscodeVideoAndAudio');
  });

  test('an optimistic direct play of a source without metadata has no reason, and is an attempt', () => {
    const label = getVerdictLabel(verdict('DirectPlay', ['Unverified']), hevcAc3Mkv);

    expect(label).toEqual({ method: 'DirectPlay', attempt: true });
  });
});

describe('a verdict that relies on streams nobody could check is told as an attempt, not a certainty', () => {
  test('a direct play', () => {
    const label = getVerdictLabel(verdict('DirectPlay', ['Unverified']), hevcAc3Mkv);

    expect(label.attempt).toBe(true);
  });

  test('a method with its own reason keeps the reason and is an attempt too (a video transcode copying an unchecked audio)', () => {
    const label = getVerdictLabel(verdict('TranscodeVideo', ['SubtitleBurnIn', 'Unverified'], { video: encode(0), audio: copy(1) }), hevcAc3Mkv);

    expect(label).toEqual({ method: 'TranscodeVideo', reason: 'SubtitleBurnIn', attempt: true });
  });

  test('a verified verdict is no attempt', () => {
    const label = getVerdictLabel(verdict('DirectPlay', []), hevcAc3Mkv);

    expect('attempt' in label).toBe(false);
  });

  test('once played, the label tells the method the server uses, which is no longer an attempt', () => {
    const label = getVerdictLabel(verdict('DirectPlay', ['Unverified']), hevcAc3Mkv, 'DirectPlay');

    expect(label).toEqual({ method: 'DirectPlay' });
  });
});

describe('the reason is the one that requires the method', () => {
  test('a remux because of the container names the container', () => {
    const label = getVerdictLabel(verdict('Remux', ['ContainerUnsupported']), mediaSource([videoStream(), audioStream()], { Container: 'ts' }));

    expect(label).toEqual({ method: 'Remux', reason: 'ContainerUnsupported', values: { container: 'TS' } });
  });

  test('an audio transcode names the audio codec the browser cannot play', () => {
    const label = getVerdictLabel(verdict('TranscodeAudio', ['AudioCodecUnsupported'], { video: copy(0), audio: encode(1) }), hevcAc3Mkv);

    expect(label).toEqual({ method: 'TranscodeAudio', reason: 'CodecUnsupported', values: { codec: 'AC3' } });
  });

  test('a video transcode names the video codec the browser cannot play', () => {
    const label = getVerdictLabel(verdict('TranscodeVideo', ['VideoCodecUnsupported'], { video: encode(0), audio: copy(1) }), hevcAc3Mkv);

    expect(label).toEqual({ method: 'TranscodeVideo', reason: 'CodecUnsupported', values: { codec: 'HEVC' } });
  });

  test('a video and audio transcode because of both codecs names both', () => {
    const label = getVerdictLabel(
      verdict('TranscodeVideo', ['VideoCodecUnsupported', 'AudioCodecUnsupported'], { video: encode(0), audio: encode(1) }),
      hevcAc3Mkv
    );

    expect(label).toEqual({ method: 'TranscodeVideoAndAudio', reason: 'CodecsUnsupported', values: { video: 'HEVC', audio: 'AC3' } });
  });

  test('the selected audio stream is the one named, not the first one', () => {
    const label = getVerdictLabel(verdict('TranscodeAudio', ['AudioCodecUnsupported'], { video: copy(0), audio: encode(2) }), tracksMkv);

    expect(label.values).toEqual({ codec: 'OPUS' });
  });

  test.each<[VerdictReason, string]>([
    ['SubtitleBurnIn', 'SubtitleBurnIn'],
    ['HdrOnSdrDisplay', 'HdrOnSdrDisplay'],
    ['ExceedsQuality', 'ExceedsQuality']
  ])('a video transcode because of %s', (reason, expected) => {
    const label = getVerdictLabel(verdict('TranscodeVideo', [reason], { video: encode(0), audio: copy(1) }), tracksMkv);

    expect(label).toEqual({ method: 'TranscodeVideo', reason: expected });
  });

  test.each<[VerdictReason, string]>([
    ['SecondaryAudioTrack', 'SecondaryAudioTrack'],
    ['ExternalAudioTrack', 'ExternalAudioTrack']
  ])('a remux because of %s', (reason, expected) => {
    const label = getVerdictLabel(verdict('Remux', [reason], { video: copy(0), audio: copy(2) }), tracksMkv);

    expect(label).toEqual({ method: 'Remux', reason: expected });
  });

  test('a reason that only asks for a cheaper method does not explain a more expensive one', () => {
    // The browser cannot open the container (remux) and cannot decode the audio (audio transcode)
    const label = getVerdictLabel(
      verdict('TranscodeAudio', ['ContainerUnsupported', 'AudioCodecUnsupported'], { video: copy(0), audio: encode(1) }),
      hevcAc3Mkv
    );

    expect(label.reason).toBe('CodecUnsupported');
  });

  test('the codec explains a video transcode before the subtitle, which is a choice of the user', () => {
    const label = getVerdictLabel(verdict('TranscodeVideo', ['SubtitleBurnIn', 'VideoCodecUnsupported'], { video: encode(0), audio: copy(1) }), hevcAc3Mkv);

    expect(label.reason).toBe('CodecUnsupported');
  });
});

describe('when no requirement explains the method', () => {
  test('a method above what the streams need because a cheaper one failed', () => {
    const label = getVerdictLabel(verdict('Remux', ['FailedBefore']), hevcAc3Mkv);

    expect(label).toEqual({ method: 'Remux', reason: 'FailedBefore' });
  });

  test('the learned floor explains a video transcode whose own requirement was only an audio transcode', () => {
    const label = getVerdictLabel(
      verdict('TranscodeVideo', ['AudioCodecUnsupported', 'FailedBefore'], { video: encode(0), audio: encode(1) }),
      hevcAc3Mkv
    );

    expect(label).toEqual({ method: 'TranscodeVideoAndAudio', reason: 'FailedBefore' });
  });

  test('a method above what the streams need because the user policy forbids the cheaper one', () => {
    const label = getVerdictLabel(
      verdict('TranscodeAudio', ['ContainerUnsupported', 'NotAllowedByPolicy'], { video: copy(0), audio: encode(1) }),
      mediaSource([videoStream(), audioStream()], { Container: 'ts' })
    );

    expect(label).toEqual({ method: 'TranscodeAudio', reason: 'PolicySimplerMethod' });
  });

  test('a playable method that the browser says is not smooth', () => {
    const label = getVerdictLabel(verdict('DirectPlay', ['NotSmooth']), hevcAc3Mkv);

    expect(label).toEqual({ method: 'DirectPlay', reason: 'NotSmooth' });
  });

  test('not smooth never hides the reason of the method', () => {
    const label = getVerdictLabel(verdict('TranscodeAudio', ['AudioCodecUnsupported', 'NotSmooth'], { video: copy(0), audio: encode(1) }), hevcAc3Mkv);

    expect(label.reason).toBe('CodecUnsupported');
  });
});

describe('why nothing can play it', () => {
  test('the quality mode allows only the original file', () => {
    const label = getVerdictLabel(verdict('Unplayable', ['VideoCodecUnsupported', 'NotAllowedByQuality']), hevcAc3Mkv);

    expect(label).toEqual({ method: 'Unplayable', reason: 'NotAllowedByQuality' });
  });

  test('the user policy forbids the method it needs', () => {
    const label = getVerdictLabel(verdict('Unplayable', ['VideoCodecUnsupported', 'NotAllowedByPolicy']), hevcAc3Mkv);

    expect(label).toEqual({ method: 'Unplayable', reason: 'PolicyNeededMethod' });
  });

  test('the browser decodes none of the transcoding targets', () => {
    const label = getVerdictLabel(verdict('Unplayable', ['VideoCodecUnsupported', 'NoDecodableTarget']), hevcAc3Mkv);

    expect(label).toEqual({ method: 'Unplayable', reason: 'NoDecodableTarget' });
  });

  test('every method failed before', () => {
    const label = getVerdictLabel(verdict('Unplayable', ['FailedBefore']), hevcAc3Mkv);

    expect(label).toEqual({ method: 'Unplayable', reason: 'NothingWorked' });
  });
});

describe('during playback, the method the server actually chose', () => {
  test('replaces the predicted one, whose reasons no longer apply', () => {
    const label = getVerdictLabel(verdict('DirectPlay', []), hevcAc3Mkv, 'Remux');

    expect(label).toEqual({ method: 'Remux' });
  });

  test('keeps the reason when it is the predicted one', () => {
    const label = getVerdictLabel(verdict('Remux', ['FailedBefore']), hevcAc3Mkv, 'Remux');

    expect(label).toEqual({ method: 'Remux', reason: 'FailedBefore' });
  });

  test('a video transcode that encodes the audio is still described as such', () => {
    const label = getVerdictLabel(
      verdict('TranscodeVideo', ['VideoCodecUnsupported', 'AudioCodecUnsupported'], { video: encode(0), audio: encode(1) }),
      hevcAc3Mkv,
      'TranscodeVideo'
    );

    expect(label.method).toBe('TranscodeVideoAndAudio');
  });

  test('a playback that could not start', () => {
    const label = getVerdictLabel(verdict('DirectPlay', []), hevcAc3Mkv, 'Unplayable');

    expect(label).toEqual({ method: 'Unplayable' });
  });
});

describe('a playback whose answer is not played is told as not playable, with the failure\'s reason', () => {
  test.each<[PlaybackMethod, PlaybackMethod]>([
    ['DirectPlay', 'TranscodeAudio'],
    ['DirectPlay', 'TranscodeVideo'],
    ['Remux', 'TranscodeAudio'],
    ['Remux', 'TranscodeVideo']
  ])('quality mode Original refuses a %s answered with %s: not the server\'s method', (predicted, actualMethod) => {
    const label = getVerdictLabel(verdict(predicted, []), hevcAc3Mkv, actualMethod, 'quality');

    expect(label).toEqual({ method: 'Unplayable', reason: 'NotAllowedByQuality' });
  });

  test('a verdict quality mode Original made unplayable keeps its reason', () => {
    const label = getVerdictLabel(verdict('Unplayable', ['VideoCodecUnsupported', 'NotAllowedByQuality']), hevcAc3Mkv, 'Unplayable', 'quality');

    expect(label).toEqual({ method: 'Unplayable', reason: 'NotAllowedByQuality' });
  });

  test('an answer that plays nothing', () => {
    const label = getVerdictLabel(verdict('Remux', []), hevcAc3Mkv, 'Unplayable', 'unplayable');

    expect(label).toEqual({ method: 'Unplayable' });
  });

  test('a verdict nothing can play keeps its reason', () => {
    const label = getVerdictLabel(verdict('Unplayable', ['VideoCodecUnsupported', 'NoDecodableTarget']), hevcAc3Mkv, 'Unplayable', 'unplayable');

    expect(label).toEqual({ method: 'Unplayable', reason: 'NoDecodableTarget' });
  });
});

describe('a change of method after a failure, as the user sees it', () => {
  /**
   * The label of what a negotiation plays: its verdict and the method the server chose
   */
  const playing = (played: Verdict, actualMethod: PlaybackMethod) => getVerdictLabel(played, hevcAc3Mkv, actualMethod).method;

  test('a video transcode that starts encoding the audio too is a change, although the server\'s method is the same', () => {
    const before = playing(verdict('TranscodeVideo', ['VideoCodecUnsupported'], { video: encode(0), audio: copy(1) }), 'TranscodeVideo');
    const after = playing(verdict('TranscodeVideo', ['VideoCodecUnsupported', 'FailedBefore'], { video: encode(0), audio: encode(1) }), 'TranscodeVideo');

    expect(getMethodChange(before, after)).toEqual({ from: 'TranscodeVideo', to: 'TranscodeVideoAndAudio' });
  });

  test('another method is a change', () => {
    const before = playing(verdict('DirectPlay', []), 'DirectPlay');
    const after = playing(verdict('Remux', ['FailedBefore']), 'Remux');

    expect(getMethodChange(before, after)).toEqual({ from: 'DirectPlay', to: 'Remux' });
  });

  test('the same method, told the same way, is no change', () => {
    const before = playing(verdict('Remux', ['ContainerUnsupported']), 'Remux');
    const after = playing(verdict('Remux', ['ContainerUnsupported', 'FailedBefore']), 'Remux');

    expect(getMethodChange(before, after)).toBeUndefined();
  });

  test('a playback that can no longer start is a change', () => {
    const before = playing(verdict('Remux', []), 'Remux');
    const after = playing(verdict('Unplayable', ['FailedBefore']), 'Unplayable');

    expect(getMethodChange(before, after)).toEqual({ from: 'Remux', to: 'Unplayable' });
  });
});

describe('codec names come from the server', () => {
  test('a codec the server does not name is not named, and the next reason is used', () => {
    const unnamed = mediaSource([videoStream({ Index: 0, Codec: undefined }), audioStream({ Index: 1 })], { Container: 'mkv' });
    const label = getVerdictLabel(verdict('TranscodeVideo', ['VideoCodecUnsupported', 'SubtitleBurnIn'], { video: encode(0), audio: copy(1) }), unnamed);

    expect(label).toEqual({ method: 'TranscodeVideo', reason: 'SubtitleBurnIn' });
  });

  test('both codecs are named only when the server names both', () => {
    const unnamed = mediaSource([videoStream({ Index: 0, Codec: 'hevc' }), audioStream({ Index: 1, Codec: undefined })], { Container: 'mkv' });
    const label = getVerdictLabel(
      verdict('TranscodeVideo', ['VideoCodecUnsupported', 'AudioCodecUnsupported'], { video: encode(0), audio: encode(1) }),
      unnamed
    );

    expect(label).toEqual({ method: 'TranscodeVideoAndAudio', reason: 'CodecUnsupported', values: { codec: 'HEVC' } });
  });

  test('the codec of an unplayable source is read from its default streams', () => {
    const label = getVerdictLabel(verdict('Unplayable', ['AudioCodecUnsupported']), hevcAc3Mkv);

    expect(label).toEqual({ method: 'Unplayable', reason: 'CodecUnsupported', values: { codec: 'AC3' } });
  });
});
