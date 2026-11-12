import { describe, expect, test } from 'vitest';
import {
  exceedsLevel,
  getAutoRunningEntry,
  getAvailableLevels,
  getModeLevel,
  getNextHigherLevel,
  getNextLowerLevel,
  getQualityMenu,
  getRequestCaps,
  getSourceLevel,
  getTranscodeLevel,
  type QualityLevel,
  type QualityMode,
  type RequestCaps,
  type VideoSize
} from '#/utils/playback-capabilities/quality.ts';

/**
 * Shorthand for a video stream size
 */
function size(width: number, height: number): VideoSize {
  return { Width: width, Height: height };
}

const unknownSize: VideoSize = { Width: undefined, Height: undefined };

describe('getSourceLevel: the ladder entry a source belongs to is the smallest box it fits in', () => {
  const cases: [string, VideoSize | undefined, QualityLevel | undefined][] = [
    ['a 1920x1080 source is 1080', size(1920, 1080), 1080],
    ['a scope 1920x800 source is still 1080 (its width needs the 1080 box)', size(1920, 800), 1080],
    ['a 4:3 1440x1080 source is 1080', size(1440, 1080), 1080],
    ['a portrait 1080x1920 source is 1080 (orientation does not matter)', size(1080, 1920), 1080],
    ['a 1000x562 source does not fit 854x480, so it is 720', size(1000, 562), 720],
    ['a tiny 320x180 source is 360', size(320, 180), 360],
    ['a source larger than the top of the ladder has no level', size(7680, 4320), undefined],
    ['a source without size has no level', unknownSize, undefined],
    ['no video stream has no level', undefined, undefined]
  ];

  test.each(cases)('%s', (_, video, expected) => {
    const result = getSourceLevel(video);

    expect(result).toBe(expected);
  });
});

describe('getAvailableLevels: ladder entries at or below the source', () => {
  const cases: [string, VideoSize | undefined, QualityLevel[]][] = [
    ['1080p offers 1080 and everything below', size(1920, 1080), [1080, 720, 480, 360]],
    ['720p offers 720 and everything below', size(1280, 720), [720, 480, 360]],
    ['2160p offers the whole ladder', size(3840, 2160), [2160, 1440, 1080, 720, 480, 360]],
    ['a source above the ladder offers the whole ladder', size(7680, 4320), [2160, 1440, 1080, 720, 480, 360]],
    ['a scope 1080p source offers 1080 and below', size(1920, 800), [1080, 720, 480, 360]],
    ['a tiny source offers only the lowest entry', size(320, 180), [360]],
    ['audio-only items have no levels', undefined, []],
    ['a video without size has no levels', unknownSize, []]
  ];

  test.each(cases)('%s', (_, video, expected) => {
    const result = getAvailableLevels(video);

    expect(result).toEqual(expected);
  });
});

describe('getQualityMenu: Automatic, Original and one entry per available resolution', () => {
  const cases: [string, VideoSize | undefined, ReturnType<typeof getQualityMenu>][] = [
    ['a 720p video shows auto, original, 720, 480 and 360', size(1280, 720), ['auto', 'original', 720, 480, 360]],
    ['music only shows auto and original', undefined, ['auto', 'original']]
  ];

  test.each(cases)('%s', (_, video, expected) => {
    const result = getQualityMenu(video);

    expect(result).toEqual(expected);
  });
});

describe('exceedsLevel: a source exceeds a level when it does not fit its box', () => {
  const cases: [string, VideoSize, QualityLevel, boolean][] = [
    ['1080p does not exceed 1080', size(1920, 1080), 1080, false],
    ['1080p exceeds 720', size(1920, 1080), 720, true],
    ['1080p does not exceed 2160', size(1920, 1080), 2160, false],
    ['portrait 1080x1920 does not exceed 1080', size(1080, 1920), 1080, false],
    ['scope 1920x800 exceeds 720 because of its width', size(1920, 800), 720, true],
    ['a video without size never exceeds a level (nothing to compare)', unknownSize, 360, false]
  ];

  test.each(cases)('%s', (_, video, level, expected) => {
    const result = exceedsLevel(video, level);

    expect(result).toBe(expected);
  });
});

describe('getModeLevel: the cap a quality mode imposes', () => {
  const cases: [string, QualityMode, QualityLevel | undefined][] = [
    ['automatic running a level caps at that level', { type: 'auto', level: 720 }, 720],
    ['automatic without a level does not cap', { type: 'auto' }, undefined],
    ['original never caps', { type: 'original' }, undefined],
    ['a fixed level caps at that level', { type: 'fixed', level: 480 }, 480]
  ];

  test.each(cases)('%s', (_, mode, expected) => {
    const result = getModeLevel(mode);

    expect(result).toBe(expected);
  });
});

describe('getTranscodeLevel: the level the server encodes at when the video has to be transcoded', () => {
  const cases: [string, VideoSize, QualityLevel | undefined, QualityLevel][] = [
    ['without a cap, at the source\'s own level', size(1920, 1080), undefined, 1080],
    ['without a cap, a source above the ladder is encoded at the top entry', size(7680, 4320), undefined, 2160],
    ['a lower cap wins', size(1920, 1080), 480, 480],
    ['a cap above the source never upscales', size(1280, 720), 2160, 720]
  ];

  test.each(cases)('%s', (_, video, cap, expected) => {
    const result = getTranscodeLevel(video, cap);

    expect(result).toBe(expected);
  });
});

describe('getAutoRunningEntry: Automatic shows the menu entry it is equivalent to', () => {
  const cases: [string, VideoSize | undefined, QualityMode & { type: 'auto' }, boolean, 'original' | QualityLevel][] = [
    ['when the video is not encoded it is running the original', size(1920, 1080), { type: 'auto', level: 720 }, false, 'original'],
    ['when the video is encoded at a capped level it shows that level', size(1920, 1080), { type: 'auto', level: 720 }, true, 720],
    ['when the video is encoded without a cap it shows the source\'s own level', size(1920, 1080), { type: 'auto' }, true, 1080],
    ['music always runs the original', undefined, { type: 'auto' }, false, 'original']
  ];

  test.each(cases)('%s', (_, video, mode, videoTranscoded, expected) => {
    const result = getAutoRunningEntry(video, mode, videoTranscoded);

    expect(result).toBe(expected);
  });
});

describe('getNextLowerLevel: one step down at a time for the runtime supervisors', () => {
  const cases: [string, QualityLevel | undefined, VideoSize | undefined, QualityLevel | undefined][] = [
    ['from the original of a 1080p source the first step down is 720', undefined, size(1920, 1080), 720],
    ['the source\'s own level counts as the original', 1080, size(1920, 1080), 720],
    ['from 720 the next step down is 480', 720, size(1920, 1080), 480],
    ['there is nothing below the lowest entry', 360, size(1920, 1080), undefined],
    ['from the original of a source above the ladder the first step is the top entry', undefined, size(7680, 4320), 2160],
    ['a source at the lowest level cannot go lower', undefined, size(320, 180), undefined],
    ['music has no steps', undefined, undefined, undefined]
  ];

  test.each(cases)('%s', (_, current, video, expected) => {
    const result = getNextLowerLevel(current, video);

    expect(result).toBe(expected);
  });
});

describe('getNextHigherLevel: one step up at a time for the runtime supervisors', () => {
  const cases: [string, QualityLevel, VideoSize, QualityLevel | undefined][] = [
    ['from 480 on a 1080p source the next step up is 720', 480, size(1920, 1080), 720],
    ['reaching the source\'s own level removes the cap', 720, size(1920, 1080), undefined],
    ['from the top entry on a source above the ladder the cap is removed', 2160, size(7680, 4320), undefined]
  ];

  test.each(cases)('%s', (_, current, video, expected) => {
    const result = getNextHigherLevel(current, video);

    expect(result).toBe(expected);
  });
});

describe('getRequestCaps: what is sent to the server for a level', () => {
  const cases: [string, QualityLevel, VideoSize | undefined, RequestCaps][] = [
    ['a landscape source gets the level\'s box and internal bitrate', 1080, size(3840, 2160), { maxBitrate: 8_000_000, maxWidth: 1920, maxHeight: 1080 }],
    ['a portrait source gets the box turned, so it is not shrunk to fit sideways', 720, size(1080, 1920), { maxBitrate: 5_000_000, maxWidth: 720, maxHeight: 1280 }],
    ['without a video size the landscape box is used', 360, undefined, { maxBitrate: 1_000_000, maxWidth: 640, maxHeight: 360 }]
  ];

  test.each(cases)('%s', (_, level, video, expected) => {
    const result = getRequestCaps(level, video);

    expect(result).toEqual(expected);
  });
});
