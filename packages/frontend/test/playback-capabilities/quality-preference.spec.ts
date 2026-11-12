import { describe, expect, test } from 'vitest';
import { QUALITY_LADDER } from '#/utils/playback-capabilities/constants.ts';
import {
  exceedsQuality,
  getAvailableLevels,
  getSourceLevel,
  type QualityLevel,
  type QualityMenuEntry,
  type QualityMode,
  type VideoInfo
} from '#/utils/playback-capabilities/quality.ts';
import {
  DEFAULT_QUALITY_PREFERENCE,
  getPreferredQualityMode,
  parseQualityPreference
} from '#/utils/playback-capabilities/quality-preference.ts';

/**
 * Shorthand for a video stream size
 */
function size(width: number, height: number): VideoInfo {
  return { Width: width, Height: height };
}

const unknownSize: VideoInfo = { Width: undefined, Height: undefined };
const ladderHeights = QUALITY_LADDER.map(entry => entry.height);

describe('parseQualityPreference: the stored preference is used only when it is a quality menu entry', () => {
  test('the default preference is Automatic', () => {
    expect(DEFAULT_QUALITY_PREFERENCE).toBe('auto');
  });

  test.each<QualityMenuEntry>(['auto', 'original', ...ladderHeights])('%s is kept', (stored) => {
    const result = parseQualityPreference(stored);

    expect(result).toBe(stored);
  });

  const garbage: [string, unknown][] = [
    ['nothing stored', undefined],
    ['a height that is not in the ladder', 1081],
    ['a ladder height as a string (the store keeps numbers)', '1080'],
    ['another spelling of a mode', 'Original'],
    ['an unknown word', '4k'],
    ['a boolean', true],
    ['an object', { type: 'fixed', level: 1080 }],
    ['an array', [1080]],
    ['NaN', NaN]
  ];

  test.each(garbage)('%s falls back to Automatic', (_, stored) => {
    const result = parseQualityPreference(stored);

    expect(result).toBe('auto');
  });
});

describe('getPreferredQualityMode: what the preference means for one media source', () => {
  const cases: [string, QualityMenuEntry, VideoInfo | undefined, QualityMode][] = [
    ['Automatic starts without a cap (the current level is runtime state)', 'auto', size(1920, 1080), { type: 'auto' }],
    ['Original is Original', 'original', size(1920, 1080), { type: 'original' }],
    ['Original applies to music too', 'original', undefined, { type: 'original' }],
    ['a resolution below the source locks the quality at that resolution', 1080, size(3840, 2160), { type: 'fixed', level: 1080 }],
    ['a resolution equal to the source locks it at the source\'s level', 1080, size(1920, 1080), { type: 'fixed', level: 1080 }],
    ['a resolution above the source is lowered to the source\'s own level', 1080, size(1280, 720), { type: 'fixed', level: 720 }],
    ['a portrait source below the resolution plays at its own level', 2160, size(1080, 1920), { type: 'fixed', level: 1080 }],
    ['a source larger than the ladder keeps the resolution as its cap', 2160, size(7680, 4320), { type: 'fixed', level: 2160 }],
    ['a video of unknown size keeps the resolution as its cap', 720, unknownSize, { type: 'fixed', level: 720 }],
    ['music has no resolutions, so a resolution means Automatic', 720, undefined, { type: 'auto' }]
  ];

  test.each(cases)('%s', (_, preference, video, expected) => {
    const result = getPreferredQualityMode(preference, video);

    expect(result).toStrictEqual(expected);
  });

  const sources = [
    size(3840, 2160),
    size(2560, 1440),
    size(1920, 1080),
    size(1920, 800),
    size(1280, 720),
    size(854, 480),
    size(640, 360),
    size(320, 180),
    // Real-world frame sizes a few pixels off the 16:9 boxes: DCI, scope, ultrawide, block-aligned, portrait
    size(4096, 2160),
    size(4096, 1716),
    size(1998, 1080),
    size(2048, 858),
    size(2560, 1080),
    size(1920, 1088),
    size(1440, 1080),
    size(1080, 1920),
    size(1088, 1920)
  ];

  test.each(ladderHeights)('a %ip preference is always one of the levels the source\'s menu offers', (preference) => {
    const offered = sources.map((video) => {
      const mode = getPreferredQualityMode(preference, video);

      return mode.type === 'fixed' && getAvailableLevels(video).includes(mode.level);
    });

    expect(offered).toStrictEqual(sources.map(() => true));
  });

  test.each(ladderHeights)('with a %ip preference, files at or below it are never encoded because of quality', (preference) => {
    const atOrBelow = sources.filter(video => getSourceLevel(video)! <= preference);
    const encoded = atOrBelow.map(video => exceedsQuality(video, getPreferredQualityMode(preference, video)));

    expect(encoded).toStrictEqual(atOrBelow.map(() => false));
  });

  test('the entry the menu names after the file never asks for an encode', () => {
    const encoded = sources.map((video) => {
      const ownLevel = getSourceLevel(video);

      return ownLevel !== undefined && exceedsQuality(video, getPreferredQualityMode(ownLevel, video));
    });

    expect(encoded).toStrictEqual(sources.map(() => false));
  });

  const onlyWider: [QualityLevel, VideoInfo][] = [
    [1080, size(1998, 1080)],
    [1080, size(2048, 858)],
    [1080, size(1920, 1088)],
    [2160, size(4096, 2160)],
    [2160, size(4096, 1716)]
  ];

  test.each(onlyWider)('with a %ip preference, a file only wider than its box (%o) is not encoded', (preference, video) => {
    const result = exceedsQuality(video, getPreferredQualityMode(preference, video));

    expect(result).toBe(false);
  });

  test('with a 720p preference, a 1080p file is encoded because of quality', () => {
    const video = size(1920, 1080);
    const result = exceedsQuality(video, getPreferredQualityMode(720, video));

    expect(result).toBe(true);
  });
});
