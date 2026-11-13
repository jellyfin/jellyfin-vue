import { describe, expect, test } from 'vitest';
import { getFailureStep, type FailureStep, type FailureStepInput } from '#/utils/playback-capabilities/failure-ladder.ts';
import type { QualityMode } from '#/utils/playback-capabilities/quality.ts';
import type { PlaybackMethod, PlaybackPolicy, StreamPlan } from '#/utils/playback-capabilities/verdict.ts';

/**
 * Plans of the streams of the verdict a playback was negotiated with
 */
const copied = (index: number): StreamPlan => ({ index, action: 'copy' });
const encoded = (index: number): StreamPlan => ({ index, action: 'transcode', targets: [{ codec: 'aac', codecString: 'mp4a.40.2' }] });

const AUTO: QualityMode = { type: 'auto' };
const ORIGINAL: QualityMode = { type: 'original' };
const FIXED: QualityMode = { type: 'fixed', level: 720 };
const ALLOWED: PlaybackPolicy = {};

/**
 * A video with audio, both copied unless said otherwise, in Automatic, with every method allowed
 */
function video(method: PlaybackMethod, overrides: Partial<FailureStepInput> = {}): FailureStepInput {
  return { method, video: copied(0), audio: copied(1), mode: AUTO, policy: ALLOWED, ...overrides };
}

/**
 * A music track
 */
function music(method: PlaybackMethod, overrides: Partial<FailureStepInput> = {}): FailureStepInput {
  return { method, audio: copied(0), mode: AUTO, policy: ALLOWED, ...overrides };
}

describe('getFailureStep: a hard failure moves one rung down the ladder (direct play, remux, audio transcode, video transcode)', () => {
  const cases: [string, FailureStepInput, FailureStep][] = [
    ['direct play fails: the next is a remux', video('DirectPlay'), { learn: 'floor', failedAt: 'DirectPlay', next: 'Remux' }],
    ['a remux fails: the next encodes the audio', video('Remux'), { learn: 'floor', failedAt: 'Remux', next: 'TranscodeAudio' }],
    [
      'an audio transcode fails: the next encodes the video',
      video('TranscodeAudio', { audio: encoded(1) }),
      { learn: 'floor', failedAt: 'TranscodeAudio', next: 'TranscodeVideo' }
    ],
    [
      'a video transcode with the audio copied fails: the copied audio is the suspect, the next encodes it too (the gap of the linear ladder)',
      video('TranscodeVideo', { video: encoded(0) }),
      { learn: 'copied-audio', failedAt: 'TranscodeVideo', next: 'TranscodeVideo' }
    ],
    [
      'a video transcode with the audio encoded fails: nothing is left',
      video('TranscodeVideo', { video: encoded(0), audio: encoded(1) }),
      { learn: 'floor', failedAt: 'TranscodeVideo' }
    ],
    [
      'a video transcode of a video without audio fails: nothing is left',
      video('TranscodeVideo', { video: encoded(0), audio: undefined }),
      { learn: 'floor', failedAt: 'TranscodeVideo' }
    ],
    ['an unplayable verdict has nothing to learn', video('Unplayable'), { learn: 'nothing' }]
  ];

  test.each(cases)('%s', (_, input, expected) => {
    const result = getFailureStep(input);

    expect(result).toEqual(expected);
  });
});

describe('getFailureStep: a failure is never learned below the method that was asked for', () => {
  /**
   * Plans of streams nobody knows (a source without stream metadata): no stream index
   */
  const unknownCopied: StreamPlan = { action: 'copy' };
  const unknownEncoded: StreamPlan = { action: 'transcode', targets: [{ codec: 'aac', codecString: 'mp4a.40.2' }] };
  const cases: [string, FailureStepInput, FailureStep][] = [
    [
      'the server\'s answer reads as a remux (it named no stream), but an audio transcode was asked for: the audio transcode failed',
      video('Remux', { asked: 'TranscodeAudio', video: unknownCopied, audio: unknownEncoded }),
      { learn: 'floor', failedAt: 'TranscodeAudio', next: 'TranscodeVideo' }
    ],
    [
      'the server chose more than was asked for: what it chose failed',
      video('TranscodeAudio', { asked: 'Remux', audio: encoded(1) }),
      { learn: 'floor', failedAt: 'TranscodeAudio', next: 'TranscodeVideo' }
    ],
    [
      'streams nobody knows still have a video to encode',
      video('DirectPlay', { asked: 'DirectPlay', video: unknownCopied, audio: unknownCopied }),
      { learn: 'floor', failedAt: 'DirectPlay', next: 'Remux' }
    ]
  ];

  test.each(cases)('%s', (_, input, expected) => {
    const result = getFailureStep(input);

    expect(result).toEqual(expected);
  });
});

describe('getFailureStep: music has no video to encode', () => {
  const cases: [string, FailureStepInput, FailureStep][] = [
    ['direct play fails: the next is a remux', music('DirectPlay'), { learn: 'floor', failedAt: 'DirectPlay', next: 'Remux' }],
    ['a remux fails: the next encodes the audio', music('Remux'), { learn: 'floor', failedAt: 'Remux', next: 'TranscodeAudio' }],
    [
      'an audio transcode fails: nothing is left',
      music('TranscodeAudio', { audio: encoded(0) }),
      { learn: 'floor', failedAt: 'TranscodeAudio' }
    ]
  ];

  test.each(cases)('%s', (_, input, expected) => {
    const result = getFailureStep(input);

    expect(result).toEqual(expected);
  });
});

describe('getFailureStep: the quality mode limits how far down it goes', () => {
  const cases: [string, FailureStepInput, FailureStep][] = [
    ['Original allows a remux after direct play', video('DirectPlay', { mode: ORIGINAL }), { learn: 'floor', failedAt: 'DirectPlay', next: 'Remux' }],
    [
      'Original allows nothing after a remux: the failure is learned and the next method is blocked by the quality',
      video('Remux', { mode: ORIGINAL }),
      { learn: 'floor', failedAt: 'Remux', blockedBy: 'quality' }
    ],
    [
      'a fixed resolution leaves the method free',
      video('Remux', { mode: FIXED }),
      { learn: 'floor', failedAt: 'Remux', next: 'TranscodeAudio' }
    ],
    [
      'a fixed resolution also closes the gap',
      video('TranscodeVideo', { mode: FIXED, video: encoded(0) }),
      { learn: 'copied-audio', failedAt: 'TranscodeVideo', next: 'TranscodeVideo' }
    ]
  ];

  test.each(cases)('%s', (_, input, expected) => {
    const result = getFailureStep(input);

    expect(result).toEqual(expected);
  });
});

describe('getFailureStep: the user policy limits how far down it goes', () => {
  const cases: [string, FailureStepInput, FailureStep][] = [
    [
      'without remuxing, direct play falls to an audio transcode',
      video('DirectPlay', { policy: { EnablePlaybackRemuxing: false } }),
      { learn: 'floor', failedAt: 'DirectPlay', next: 'TranscodeAudio' }
    ],
    [
      'without video transcoding a video has no rung above direct play (the server only streams HLS to users who may transcode it)',
      video('DirectPlay', { policy: { EnableVideoPlaybackTranscoding: false } }),
      { learn: 'floor', failedAt: 'DirectPlay', blockedBy: 'policy' }
    ],
    [
      'without audio transcoding a failed remux of a video falls to a video transcode',
      video('Remux', { policy: { EnableAudioPlaybackTranscoding: false } }),
      { learn: 'floor', failedAt: 'Remux', next: 'TranscodeVideo' }
    ],
    [
      'without audio transcoding the gap cannot be closed',
      video('TranscodeVideo', { video: encoded(0), policy: { EnableAudioPlaybackTranscoding: false } }),
      { learn: 'copied-audio', failedAt: 'TranscodeVideo', blockedBy: 'policy' }
    ],
    [
      'without audio transcoding music has no rung above direct play',
      music('DirectPlay', { policy: { EnableAudioPlaybackTranscoding: false } }),
      { learn: 'floor', failedAt: 'DirectPlay', blockedBy: 'policy' }
    ],
    [
      'the quality mode is reported before the policy when both block',
      video('Remux', { mode: ORIGINAL, policy: { EnableAudioPlaybackTranscoding: false, EnableVideoPlaybackTranscoding: false } }),
      { learn: 'floor', failedAt: 'Remux', blockedBy: 'quality' }
    ]
  ];

  test.each(cases)('%s', (_, input, expected) => {
    const result = getFailureStep(input);

    expect(result).toEqual(expected);
  });
});
