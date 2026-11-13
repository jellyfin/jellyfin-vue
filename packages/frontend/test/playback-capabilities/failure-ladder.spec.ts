import { describe, expect, test } from 'vitest';
import {
  getFailureLesson,
  getFailureStep,
  getScopedFloor,
  learnFailure,
  learnSourceFloor,
  NO_LEARNED_FLOORS,
  type FailureEvidence,
  type FailureLesson,
  type FailureStep,
  type FailureStepInput
} from '#/utils/playback-capabilities/failure-ladder.ts';
import type { QualityMode } from '#/utils/playback-capabilities/quality.ts';
import {
  getNextFloor,
  PLAYBACK_RUNGS,
  type PlaybackMethod,
  type PlaybackPolicy,
  type StreamPlan
} from '#/utils/playback-capabilities/verdict.ts';

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

describe('getFailureLesson: a failure teaches the signature only what looks like a wrong answer of the browser', () => {
  type FloorStep = Extract<FailureStep, { learn: 'floor' }>;

  const cases: [string, FloorStep, FailureEvidence, FailureLesson][] = [
    [
      'direct play failed before it had worked (a codec the browser claims): the source and the signature start at a remux',
      { learn: 'floor', failedAt: 'DirectPlay', next: 'Remux' },
      'browser',
      { source: 'Remux', signature: 'Remux', withdraw: false }
    ],
    [
      'direct play failed after it had worked (a broken file, a transient error): only the source starts at a remux',
      { learn: 'floor', failedAt: 'DirectPlay', next: 'Remux' },
      'file',
      { source: 'Remux', withdraw: false }
    ],
    [
      'a remux failed after it had worked: only the source moves on to the audio transcode',
      { learn: 'floor', failedAt: 'Remux', next: 'TranscodeAudio' },
      'file',
      { source: 'TranscodeAudio', withdraw: false }
    ],
    [
      'the signature learns the failed rung, not the next one the policy allows (the policy is the user\'s, the rung is the browser\'s)',
      { learn: 'floor', failedAt: 'DirectPlay', next: 'TranscodeAudio' },
      'browser',
      { source: 'Remux', signature: 'Remux', withdraw: false }
    ],
    [
      'an audio transcode failed before it had worked: the signature starts at a video transcode, which is still left',
      { learn: 'floor', failedAt: 'TranscodeAudio', next: 'TranscodeVideo' },
      'browser',
      { source: 'TranscodeVideo', signature: 'TranscodeVideo', withdraw: false }
    ],
    [
      'the full transcode failed: the source is unplayable, the signature learns nothing and what this playback taught it is withdrawn',
      { learn: 'floor', failedAt: 'TranscodeVideo' },
      'browser',
      { source: 'Unplayable', withdraw: true }
    ],
    [
      'the full transcode failed after it had worked: the same',
      { learn: 'floor', failedAt: 'TranscodeVideo' },
      'file',
      { source: 'Unplayable', withdraw: true }
    ],
    [
      'music: its full transcode (the audio transcode) failed: the source is unplayable and the lessons are withdrawn',
      { learn: 'floor', failedAt: 'TranscodeAudio' },
      'browser',
      { source: 'Unplayable', withdraw: true }
    ],
    [
      'the policy forbids every rung above: the source learns the failure, the signature nothing (it would leave it nothing to play), nothing is withdrawn (the full transcode was not tried)',
      { learn: 'floor', failedAt: 'DirectPlay', blockedBy: 'policy' },
      'browser',
      { source: 'Remux', withdraw: false }
    ],
    [
      'Original forbids every rung above a failed remux: the same',
      { learn: 'floor', failedAt: 'Remux', blockedBy: 'quality' },
      'browser',
      { source: 'TranscodeAudio', withdraw: false }
    ]
  ];

  test.each(cases)('%s', (_, step, evidence, expected) => {
    expect(getFailureLesson(step, evidence)).toEqual(expected);
  });

  test('the signature is never taught that nothing plays, whatever failed', () => {
    const steps: FloorStep[] = PLAYBACK_RUNGS.flatMap(failedAt => [
      { learn: 'floor', failedAt },
      { learn: 'floor', failedAt, blockedBy: 'policy' },
      { learn: 'floor', failedAt, blockedBy: 'quality' }
    ] as FloorStep[]);
    const taught = steps.map(step => getFailureLesson(step, 'browser').signature);

    expect(taught.filter(floor => floor !== undefined)).toEqual([]);
  });
});

describe('learned floors: one scope per media source, one per signature', () => {
  const H264_AAC = 'video/mp4; codecs="avc1.64001e"|audio/mp4; codecs="mp4a.40.2"';
  const HEVC_AAC = 'video/mp4; codecs="hvc1.2.4.L120.90"|audio/mp4; codecs="mp4a.40.2"';
  const movieA = { source: 'movie-a|movie-a', signature: H264_AAC, chain: 'movie-a|movie-a|1' };
  const movieB = { source: 'movie-b|movie-b', signature: H264_AAC, chain: 'movie-b|movie-b|2' };
  const browserFailure = (failedAt: 'DirectPlay' | 'Remux' | 'TranscodeAudio', next: PlaybackMethod) =>
    getFailureLesson({ learn: 'floor', failedAt, next: next as 'Remux' }, 'browser');

  test('nothing learned: no floor', () => {
    expect(getScopedFloor(NO_LEARNED_FLOORS, H264_AAC, movieA.source)).toBeUndefined();
  });

  test('a failure after the playback had worked raises that media source only: another file with the same streams is unaffected', () => {
    const floors = learnFailure(NO_LEARNED_FLOORS, movieA, getFailureLesson({ learn: 'floor', failedAt: 'DirectPlay', next: 'Remux' }, 'file'));

    expect([
      getScopedFloor(floors, H264_AAC, movieA.source),
      getScopedFloor(floors, H264_AAC, movieB.source),
      getScopedFloor(floors, H264_AAC)
    ]).toEqual(['Remux', undefined, undefined]);
  });

  test('a failure before it had worked raises the signature too: another file with the same streams starts above the failed rung', () => {
    const floors = learnFailure(NO_LEARNED_FLOORS, movieA, browserFailure('DirectPlay', 'Remux'));

    expect([getScopedFloor(floors, H264_AAC, movieB.source), getScopedFloor(floors, HEVC_AAC, movieB.source)]).toEqual(['Remux', undefined]);
  });

  test('a verdict starts at the higher of its source\'s and its signature\'s floors', () => {
    const signatureRemux = learnFailure(NO_LEARNED_FLOORS, movieB, browserFailure('DirectPlay', 'Remux'));
    const sourceAudioTranscode = learnSourceFloor(signatureRemux, movieA.source, 'TranscodeAudio');

    expect([getScopedFloor(sourceAudioTranscode, H264_AAC, movieA.source), getScopedFloor(signatureRemux, H264_AAC, movieA.source)])
      .toEqual(['TranscodeAudio', 'Remux']);
  });

  test('floors only rise, in both scopes', () => {
    const high = learnFailure(NO_LEARNED_FLOORS, movieA, browserFailure('Remux', 'TranscodeAudio'));
    const after = learnFailure(learnSourceFloor(high, movieA.source, 'Remux'), movieA, browserFailure('DirectPlay', 'Remux'));

    expect([getScopedFloor(after, H264_AAC, movieA.source), getScopedFloor(after, H264_AAC, movieB.source)]).toEqual(['TranscodeAudio', 'TranscodeAudio']);
  });

  test('a source that exhausts the ladder is unplayable, and what it taught the signature during that playback is withdrawn', () => {
    let floors = learnFailure(NO_LEARNED_FLOORS, movieA, browserFailure('DirectPlay', 'Remux'));

    floors = learnFailure(floors, movieA, browserFailure('Remux', 'TranscodeAudio'));
    floors = learnFailure(floors, movieA, browserFailure('TranscodeAudio', 'TranscodeVideo'));

    expect(getScopedFloor(floors, H264_AAC, movieB.source)).toBe('TranscodeVideo');

    floors = learnFailure(floors, movieA, getFailureLesson({ learn: 'floor', failedAt: 'TranscodeVideo' }, 'browser'));

    expect([getScopedFloor(floors, H264_AAC, movieA.source), getScopedFloor(floors, H264_AAC, movieB.source)]).toEqual(['Unplayable', undefined]);
  });

  test('the withdrawal keeps what other files taught the signature', () => {
    let floors = learnFailure(NO_LEARNED_FLOORS, movieB, browserFailure('DirectPlay', 'Remux'));

    floors = learnFailure(floors, movieA, browserFailure('Remux', 'TranscodeAudio'));
    floors = learnFailure(floors, movieA, getFailureLesson({ learn: 'floor', failedAt: 'TranscodeVideo' }, 'browser'));

    expect(getScopedFloor(floors, H264_AAC, 'movie-c|movie-c')).toBe('Remux');
  });

  test('the withdrawal keeps what the same file taught in an earlier playback', () => {
    let floors = learnFailure(NO_LEARNED_FLOORS, movieA, browserFailure('DirectPlay', 'Remux'));
    const again = { ...movieA, chain: 'movie-a|movie-a|7' };

    floors = learnFailure(floors, again, browserFailure('Remux', 'TranscodeAudio'));
    floors = learnFailure(floors, again, getFailureLesson({ learn: 'floor', failedAt: 'TranscodeVideo' }, 'browser'));

    expect(getScopedFloor(floors, H264_AAC, movieB.source)).toBe('Remux');
  });

  test('the user\'s "try another method" teaches the signature, bounded the same way', () => {
    // The manual action is evidence about the browser (silent audio from a codec it claimed)
    let floors = learnFailure(NO_LEARNED_FLOORS, movieA, getFailureLesson({ learn: 'floor', failedAt: 'DirectPlay', next: 'Remux' }, 'browser'));

    expect(getScopedFloor(floors, H264_AAC, movieB.source)).toBe('Remux');

    floors = learnFailure(floors, movieA, getFailureLesson({ learn: 'floor', failedAt: 'TranscodeVideo' }, 'browser'));

    expect(getScopedFloor(floors, H264_AAC, movieB.source)).toBeUndefined();
  });
});

describe('what the server answers teaches the media source, not the signature', () => {
  const signature = 'video/mp4; codecs="avc1.64001e"|audio/mp4; codecs="mp4a.40.2"';

  test('a remote bitrate limit that made the server encode one file leaves the other files with the same codecs as they were', () => {
    const floor = getNextFloor({ method: 'DirectPlay' }, { actualMethod: 'TranscodeVideo' });
    const floors = floor ? learnSourceFloor(NO_LEARNED_FLOORS, 'movie-a|movie-a', floor) : NO_LEARNED_FLOORS;

    expect([getScopedFloor(floors, signature, 'movie-a|movie-a'), getScopedFloor(floors, signature, 'movie-b|movie-b')])
      .toEqual(['TranscodeVideo', undefined]);
  });
});

describe('getFailureStep: the policy follows the type of item the server sees', () => {
  const cases: [string, FailureStepInput, FailureStep][] = [
    [
      'a video item without a video stream needs the permission to transcode video for every rung above direct play (the server treats it as a video)',
      { method: 'DirectPlay', audio: copied(0), mediaType: 'Video', mode: AUTO, policy: { EnableVideoPlaybackTranscoding: false } },
      { learn: 'floor', failedAt: 'DirectPlay', blockedBy: 'policy' }
    ],
    [
      'with that permission it moves on to a remux',
      { method: 'DirectPlay', audio: copied(0), mediaType: 'Video', mode: AUTO, policy: ALLOWED },
      { learn: 'floor', failedAt: 'DirectPlay', next: 'Remux' }
    ],
    [
      'it still has no video to encode: an audio transcode is its last rung',
      { method: 'TranscodeAudio', audio: encoded(0), mediaType: 'Video', mode: AUTO, policy: ALLOWED },
      { learn: 'floor', failedAt: 'TranscodeAudio' }
    ],
    [
      'music only needs the permission to transcode audio',
      music('DirectPlay', { mediaType: 'Audio', policy: { EnableVideoPlaybackTranscoding: false } }),
      { learn: 'floor', failedAt: 'DirectPlay', next: 'Remux' }
    ]
  ];

  test.each(cases)('%s', (_, input, expected) => {
    expect(getFailureStep(input)).toEqual(expected);
  });
});
