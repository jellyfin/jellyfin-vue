import { describe, expect, test } from 'vitest';
import { compareVerdicts, pickBest, rankVerdicts } from '#/utils/playback-capabilities/ranking.ts';
import type { PlaybackMethod, Verdict } from '#/utils/playback-capabilities/verdict.ts';

/**
 * A verdict with only what ranking looks at
 */
function verdict(method: PlaybackMethod, options: { smooth?: boolean; height?: number; bitrate?: number; unverified?: boolean } = {}): Verdict {
  const height = options.height ?? 1080;

  return {
    method,
    reasons: [],
    smooth: options.smooth ?? method !== 'Unplayable',
    unverified: options.unverified ?? false,
    signature: '',
    quality: { width: Math.round(height * 16 / 9), height, bitrate: options.bitrate ?? 8_000_000 }
  };
}

describe('the owner\'s example', () => {
  const directPlay4kNotSmooth = verdict('DirectPlay', { smooth: false, height: 2160 });

  test('a 4K direct play flagged not smooth loses to a smooth 1080p source that only needs audio transcoding', () => {
    const best = pickBest([directPlay4kNotSmooth, verdict('TranscodeAudio', { height: 1080 })]);

    expect(best).toBe(1);
  });

  test('and it beats any source that needs video transcoding', () => {
    const best = pickBest([verdict('TranscodeVideo', { height: 2160 }), verdict('TranscodeVideo', { height: 1080 }), directPlay4kNotSmooth]);

    expect(best).toBe(2);
  });
});

describe('penalties, from worst to mildest: unplayable, video transcode, not smooth, audio transcode, remux, none', () => {
  const ordered: [string, Verdict, Verdict][] = [
    ['unplayable is worse than a video transcode that is not smooth', verdict('Unplayable', { height: 2160 }), verdict('TranscodeVideo', { smooth: false, height: 360 })],
    ['a video transcode is worse than a direct play that is not smooth', verdict('TranscodeVideo'), verdict('DirectPlay', { smooth: false })],
    ['a video transcode is worse than a remux that is not smooth', verdict('TranscodeVideo'), verdict('Remux', { smooth: false })],
    ['not smooth is worse than an audio transcode', verdict('DirectPlay', { smooth: false }), verdict('TranscodeAudio')],
    ['an audio transcode is worse than a remux', verdict('TranscodeAudio', { height: 2160 }), verdict('Remux', { height: 360 })],
    ['a remux is worse than a direct play', verdict('Remux', { height: 2160 }), verdict('DirectPlay', { height: 360 })],
    ['a smooth video transcode is better than one that is not smooth', verdict('TranscodeVideo', { smooth: false, height: 2160 }), verdict('TranscodeVideo', { height: 360 })]
  ];

  test.each(ordered)('%s', (_, worse, better) => {
    const comparison = compareVerdicts(better, worse);

    expect(comparison).toBeLessThan(0);
  });
});

describe('at the same method, a verified verdict ranks above an attempt (unverified), after every other penalty', () => {
  const ordered: [string, Verdict, Verdict][] = [
    ['an attempted direct play loses to a verified one, even of lower quality', verdict('DirectPlay', { unverified: true, height: 2160 }), verdict('DirectPlay', { height: 360 })],
    ['an attempted video transcode loses to a verified one', verdict('TranscodeVideo', { unverified: true, height: 2160 }), verdict('TranscodeVideo', { height: 360 })],
    ['an attempted direct play still beats a verified remux', verdict('Remux', { height: 2160 }), verdict('DirectPlay', { unverified: true, height: 360 })],
    ['an attempted direct play still beats a verified direct play that is not smooth', verdict('DirectPlay', { smooth: false, height: 2160 }), verdict('DirectPlay', { unverified: true, height: 360 })]
  ];

  test.each(ordered)('%s', (_, worse, better) => {
    const comparison = compareVerdicts(better, worse);

    expect(comparison).toBeLessThan(0);
  });

  test('two attempts at the same method go by quality', () => {
    const best = pickBest([verdict('DirectPlay', { unverified: true, height: 720 }), verdict('DirectPlay', { unverified: true, height: 1080 })]);

    expect(best).toBe(1);
  });
});

describe('ties: higher quality first, then server order', () => {
  test('with the same penalties the higher resolution wins', () => {
    const best = pickBest([verdict('DirectPlay', { height: 720 }), verdict('DirectPlay', { height: 1080 })]);

    expect(best).toBe(1);
  });

  test('with the same resolution the higher bitrate wins', () => {
    const best = pickBest([verdict('Remux', { bitrate: 4_000_000 }), verdict('Remux', { bitrate: 9_000_000 })]);

    expect(best).toBe(1);
  });

  test('with everything equal the server\'s order decides', () => {
    const best = pickBest([verdict('DirectPlay'), verdict('DirectPlay')]);
    const comparison = compareVerdicts(verdict('DirectPlay'), verdict('DirectPlay'));

    expect([best, comparison]).toEqual([0, 0]);
  });

  test('a verdict without known quality ranks below one with it', () => {
    const unknown: Verdict = { ...verdict('DirectPlay'), quality: {} };
    const best = pickBest([unknown, verdict('DirectPlay', { height: 360, bitrate: 1 })]);

    expect(best).toBe(1);
  });
});

describe('pickBest and rankVerdicts', () => {
  test('there is no best of nothing', () => {
    const best = pickBest([]);

    expect(best).toBe(-1);
  });

  test('there is no most compatible version when none plays', () => {
    const best = pickBest([verdict('Unplayable', { height: 1080 }), verdict('Unplayable', { height: 2160 })]);

    expect(best).toBe(-1);
  });

  test('one version that plays is the best, however bad', () => {
    const best = pickBest([verdict('Unplayable', { height: 2160 }), verdict('TranscodeVideo', { smooth: false, height: 360 })]);

    expect(best).toBe(1);
  });

  test('rankVerdicts lists every index, best first, keeping server order on ties', () => {
    const ranking = rankVerdicts([
      verdict('TranscodeVideo'),
      verdict('DirectPlay', { height: 720 }),
      verdict('Unplayable'),
      verdict('DirectPlay', { height: 720 }),
      verdict('Remux')
    ]);

    expect(ranking).toEqual([1, 3, 4, 0, 2]);
  });
});
