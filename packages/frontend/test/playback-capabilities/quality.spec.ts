import { describe, expect, test } from 'vitest';
import {
  exceedsLevel,
  exceedsQuality,
  getAvailableLevels,
  getEncodedLevel,
  getLevelBitrate,
  getModeLevel,
  getNextHigherLevel,
  getNextLowerLevel,
  getQualityMenu,
  getRequestCaps,
  getRunningEntry,
  getSourceLevel,
  getTranscodeLevel,
  type QualityLevel,
  type QualityMode,
  type RequestCaps,
  type VideoInfo
} from '#/utils/playback-capabilities/quality.ts';
import type { PlaybackMethod } from '#/utils/playback-capabilities/verdict.ts';

/**
 * Shorthand for a video stream size, with its bitrate when it matters
 */
function size(width: number, height: number, bitrate?: number): VideoInfo {
  return { Width: width, Height: height, BitRate: bitrate };
}

/**
 * A 1080p source whose bitrate (40 Mbps) is above the 1080 level's internal bitrate (8 Mbps)
 */
const heavy1080 = size(1920, 1080, 40_000_000);
/**
 * A 1080p source whose bitrate (6 Mbps) is below the 1080 level's internal bitrate
 */
const light1080 = size(1920, 1080, 6_000_000);

const unknownSize: VideoInfo = { Width: undefined, Height: undefined };

describe('getSourceLevel: the ladder entry a source belongs to is the smallest level its short side fits', () => {
  const cases: [string, VideoInfo | undefined, QualityLevel | undefined][] = [
    ['a 1920x1080 source is 1080', size(1920, 1080), 1080],
    ['a scope 1920x800 source is still 1080 (its height is above 720)', size(1920, 800), 1080],
    ['a 4:3 1440x1080 source is 1080', size(1440, 1080), 1080],
    ['a portrait 1080x1920 source is 1080 (orientation does not matter)', size(1080, 1920), 1080],
    ['a 1000x562 source is above 480, so it is 720', size(1000, 562), 720],
    ['a tiny 320x180 source is 360', size(320, 180), 360],
    ['a 320x240 source below the smallest level is 360', size(320, 240), 360],
    ['a source larger than the top of the ladder has no level', size(7680, 4320), undefined],
    ['a DCI 1998x1080 source is 1080: only wider than the 1080 box', size(1998, 1080), 1080],
    ['a DCI scope 2048x858 source is 1080', size(2048, 858), 1080],
    ['an ultrawide 2560x1080 source is 1080', size(2560, 1080), 1080],
    ['a 1920x1088 source is 1080: 1088 is 1080 coded in whole 16-pixel blocks', size(1920, 1088), 1080],
    ['a portrait 1088x1920 source is 1080 too', size(1088, 1920), 1080],
    ['a source one block above 1080 is not 1080 any more', size(1920, 1104), 1440],
    ['a DCI 4096x2160 source is 2160, the top of the ladder', size(4096, 2160), 2160],
    ['a DCI scope 4096x1716 source is 2160', size(4096, 1716), 2160],
    ['a source without size has no level', unknownSize, undefined],
    ['no video stream has no level', undefined, undefined]
  ];

  test.each(cases)('%s', (_, video, expected) => {
    const result = getSourceLevel(video);

    expect(result).toBe(expected);
  });
});

describe('getAvailableLevels: ladder entries at or below the source', () => {
  const cases: [string, VideoInfo | undefined, QualityLevel[]][] = [
    ['1080p offers 1080 and everything below', size(1920, 1080), [1080, 720, 480, 360]],
    ['720p offers 720 and everything below', size(1280, 720), [720, 480, 360]],
    ['2160p offers the whole ladder', size(3840, 2160), [2160, 1440, 1080, 720, 480, 360]],
    ['a source above the ladder offers the whole ladder', size(7680, 4320), [2160, 1440, 1080, 720, 480, 360]],
    ['a scope 1080p source offers 1080 and below', size(1920, 800), [1080, 720, 480, 360]],
    ['a DCI scope 2048x858 source offers 1080 and below', size(2048, 858), [1080, 720, 480, 360]],
    ['a DCI 4096x2160 source offers the whole ladder, the top being its own level', size(4096, 2160), [2160, 1440, 1080, 720, 480, 360]],
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
  const cases: [string, VideoInfo | undefined, ReturnType<typeof getQualityMenu>][] = [
    ['a 720p video shows auto, original, 720, 480 and 360', size(1280, 720), ['auto', 'original', 720, 480, 360]],
    ['music only shows auto and original', undefined, ['auto', 'original']]
  ];

  test.each(cases)('%s', (_, video, expected) => {
    const result = getQualityMenu(video);

    expect(result).toEqual(expected);
  });
});

describe('exceedsLevel: a source exceeds a level when its short side is above the level', () => {
  const cases: [string, VideoInfo, QualityLevel, boolean][] = [
    ['1080p does not exceed 1080', size(1920, 1080), 1080, false],
    ['1080p exceeds 720', size(1920, 1080), 720, true],
    ['1080p does not exceed 2160', size(1920, 1080), 2160, false],
    ['portrait 1080x1920 does not exceed 1080', size(1080, 1920), 1080, false],
    ['scope 1920x800 exceeds 720 because of its height', size(1920, 800), 720, true],
    ['DCI 1998x1080 does not exceed 1080', size(1998, 1080), 1080, false],
    ['DCI 4096x2160 does not exceed 2160', size(4096, 2160), 2160, false],
    ['1920x1088 does not exceed 1080 (block alignment)', size(1920, 1088), 1080, false],
    ['1920x1104 exceeds 1080 (more than the block alignment)', size(1920, 1104), 1080, true],
    ['DCI 1998x1080 exceeds 720', size(1998, 1080), 720, true],
    ['a video without size never exceeds a level (nothing to compare)', unknownSize, 360, false]
  ];

  test.each(cases)('%s', (_, video, level, expected) => {
    const result = exceedsLevel(video, level);

    expect(result).toBe(expected);
  });
});

describe('exceedsQuality: when a quality mode forces the video to be encoded', () => {
  const cases: [string, VideoInfo, QualityMode, boolean][] = [
    ['a fixed level only looks at resolution: the source\'s own level never forces, whatever the bitrate', heavy1080, { type: 'fixed', level: 1080 }, false],
    ['a fixed level above the source never forces', heavy1080, { type: 'fixed', level: 2160 }, false],
    ['a fixed level below the source forces', light1080, { type: 'fixed', level: 720 }, true],
    ['automatic at the source\'s own level forces a source whose bitrate is above the level\'s', heavy1080, { type: 'auto', level: 1080 }, true],
    ['automatic at the source\'s own level does not force a source whose bitrate fits', light1080, { type: 'auto', level: 1080 }, false],
    ['automatic below the source forces', light1080, { type: 'auto', level: 720 }, true],
    ['automatic at a level whose bitrate is above the source\'s does not force', heavy1080, { type: 'auto', level: 2160 }, false],
    ['automatic without a current level never forces', heavy1080, { type: 'auto' }, false],
    ['original never forces', heavy1080, { type: 'original' }, false],
    ['automatic with an unknown bitrate decides by resolution only', size(1920, 1080), { type: 'auto', level: 1080 }, false],
    ['automatic asked to encode the video (playback not smooth) forces it although the source fits', light1080, { type: 'auto', encodeVideo: true }, true],
    ['automatic asked to encode the video at the source\'s own level forces it whatever the bitrate', light1080, { type: 'auto', level: 1080, encodeVideo: true }, true]
  ];

  test.each(cases)('%s', (_, video, mode, expected) => {
    const result = exceedsQuality(video, mode);

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
  const cases: [string, VideoInfo, QualityLevel | undefined, QualityLevel][] = [
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

describe('getRunningEntry: the menu entry equivalent to what is playing, which Automatic shows as its subtitle', () => {
  const cases: [string, VideoInfo | undefined, PlaybackMethod, QualityLevel | undefined, 'original' | QualityLevel | undefined][] = [
    ['the original file played directly is Original', size(1920, 1080), 'DirectPlay', undefined, 'original'],
    ['a remux (every stream copied) is Original too: the Original entry allows it', size(1920, 1080), 'Remux', 720, 'original'],
    ['a video encoded at a capped level is that level', size(1920, 1080), 'TranscodeVideo', 720, 720],
    ['a video encoded without a cap is at the source\'s own level', size(1920, 1080), 'TranscodeVideo', undefined, 1080],
    ['a cap above the source never upscales: it is the source\'s own level', size(1280, 720), 'TranscodeVideo', 1080, 720],
    [
      'only the audio encoded is not Original (Original forbids it): it is the source\'s own level, whose entry plays the same',
      size(1920, 1080), 'TranscodeAudio', undefined, 1080
    ],
    ['music played as it is is Original', undefined, 'DirectPlay', undefined, 'original'],
    ['music with its audio encoded matches no entry (music has no resolutions)', undefined, 'TranscodeAudio', undefined, undefined],
    ['an encoded video of unknown size matches no entry (its menu has no resolutions)', unknownSize, 'TranscodeVideo', undefined, undefined],
    ['nothing playable matches no entry', size(1920, 1080), 'Unplayable', undefined, undefined]
  ];

  test.each(cases)('%s', (_, video, method, cap, expected) => {
    const result = getRunningEntry(video, method, cap);

    expect(result).toBe(expected);
  });

  test('an encoded video shows the level it is decoded at, when the server encoded it below the cap', () => {
    expect(getRunningEntry(size(1920, 1080), 'TranscodeVideo', undefined, size(1280, 720))).toBe(720);
  });

  test('the decoded size only matters for an encoded video', () => {
    expect(getRunningEntry(size(1920, 1080), 'DirectPlay', undefined, size(1280, 720))).toBe('original');
  });
});

describe('getEncodedLevel: the level an encoded video runs at is the size it is decoded at, never above the cap', () => {
  const cases: [string, VideoInfo, QualityLevel | undefined, VideoInfo | undefined, QualityLevel][] = [
    ['without the decoded size, the cap (never above the source)', size(1920, 1080), 1080, undefined, 1080],
    [
      'the server lowered the resolution (it caps the width by the bitrate and frame rate): the decoded size wins',
      size(1920, 1080), undefined, size(1280, 720), 720
    ],
    ['a scope output keeps its level (its width needs the 1080 box)', size(1920, 1080), 1080, size(1920, 800), 1080],
    ['the decoded size never raises the level above the cap', size(1920, 1080), 480, size(1280, 720), 480],
    ['a decoded size of zero (no picture yet) is unknown', size(1920, 1080), 720, size(0, 0), 720]
  ];

  test.each(cases)('%s', (_, video, cap, decoded, expected) => {
    expect(getEncodedLevel(video, cap, decoded)).toBe(expected);
  });
});

describe('getNextLowerLevel: one step down at a time for the runtime supervisors', () => {
  const cases: [string, QualityLevel | undefined, VideoInfo | undefined, QualityLevel | undefined][] = [
    ['from the original of a 1080p source the first step down is 720', undefined, size(1920, 1080), 720],
    ['the source\'s own level counts as the original', 1080, size(1920, 1080), 720],
    ['from 720 the next step down is 480', 720, size(1920, 1080), 480],
    ['there is nothing below the lowest entry', 360, size(1920, 1080), undefined],
    ['from the original of a source above the ladder the first step is the top entry', undefined, size(7680, 4320), 2160],
    ['a source at the lowest level cannot go lower', undefined, size(320, 180), undefined],
    ['music has no steps', undefined, undefined, undefined],
    ['from the original of a heavy 1080p source the first step is 1080 at the ladder bitrate', undefined, heavy1080, 1080],
    ['from 1080 at the ladder bitrate the next step is 720', 1080, heavy1080, 720],
    ['a light 1080p source skips its own level: it would be the same as the original', undefined, light1080, 720]
  ];

  test.each(cases)('%s', (_, current, video, expected) => {
    const result = getNextLowerLevel(current, video);

    expect(result).toBe(expected);
  });
});

describe('getNextHigherLevel: one step up at a time for the runtime supervisors', () => {
  const cases: [string, QualityLevel, VideoInfo, QualityLevel | undefined][] = [
    ['from 480 on a 1080p source the next step up is 720', 480, size(1920, 1080), 720],
    ['reaching the source\'s own level removes the cap', 720, size(1920, 1080), undefined],
    ['from the top entry on a source above the ladder the cap is removed', 2160, size(7680, 4320), undefined],
    ['a heavy source goes back up through its own level at the ladder bitrate', 720, heavy1080, 1080],
    ['and from there to the original', 1080, heavy1080, undefined],
    ['a light source goes from the level below straight to the original', 720, light1080, undefined]
  ];

  test.each(cases)('%s', (_, current, video, expected) => {
    const result = getNextHigherLevel(current, video);

    expect(result).toBe(expected);
  });
});

describe('the steps of Automatic are expressible: original, the source\'s own level encoded, then lower levels', () => {
  test('a 1080p 40 Mbps source steps down 1080, 720, 480, 360, every step encoding the video', () => {
    const steps: QualityLevel[] = [];
    const forced: boolean[] = [];
    const shown: ('original' | QualityLevel | undefined)[] = [];
    let current = getNextLowerLevel(undefined, heavy1080);

    while (current !== undefined) {
      const mode = { type: 'auto', level: current } as const;
      const isForced = exceedsQuality(heavy1080, mode);
      const entry = getRunningEntry(heavy1080, 'TranscodeVideo', current);

      steps.push(current);
      forced.push(isForced);
      shown.push(entry);
      current = getNextLowerLevel(current, heavy1080);
    }

    expect({ steps, forced, shown }).toEqual({
      steps: [1080, 720, 480, 360],
      forced: [true, true, true, true],
      shown: [1080, 720, 480, 360]
    });
  });

  test('before the first step it is running the original', () => {
    const shown = getRunningEntry(heavy1080, 'DirectPlay');

    expect(shown).toBe('original');
  });
});

describe('getRequestCaps: what is sent to the server for a level', () => {
  const cases: [string, QualityLevel, VideoInfo | undefined, RequestCaps][] = [
    ['a landscape source gets the level\'s box and internal bitrate', 1080, size(3840, 2160), { maxBitrate: 8_000_000, maxWidth: 1920, maxHeight: 1080 }],
    ['a portrait source gets the box turned, so it is not shrunk to fit sideways', 720, size(1080, 1920), { maxBitrate: 5_000_000, maxWidth: 720, maxHeight: 1280 }],
    ['without a video size the landscape box is used', 360, undefined, { maxBitrate: 1_000_000, maxWidth: 640, maxHeight: 360 }],
    ['a source only wider than a level still gets that level\'s box when it is encoded', 720, size(1998, 1080), { maxBitrate: 5_000_000, maxWidth: 1280, maxHeight: 720 }]
  ];

  test.each(cases)('%s', (_, level, video, expected) => {
    const result = getRequestCaps(level, video);

    expect(result).toEqual(expected);
  });
});

/**
 * Jellyfin 12.4's rule for the width of an encode (`ResolutionNormalizer.Normalize`, with the h264-equivalent bitrate
 * of `EncodingHelper.ScaleBitrate` for an H.264 output), copied from the server's source as the specification: the
 * bitrate is weighed against brackets made for 30 fps, scaled by 30 / fps up to 30 fps and by 1 / sqrt(fps / 30) above,
 * and the width is capped at the bracket's
 */
const SERVER_WIDTH_BRACKETS: readonly (readonly [maxWidth: number, maxBitrate: number])[] = [
  [416, 365_000], [640, 730_000], [768, 1_100_000], [960, 3_000_000], [1280, 6_000_000], [1920, 13_500_000],
  [2560, 28_000_000], [3840, 50_000_000]
];

/**
 * The h264-equivalent bitrate of an H.264 output (`EncodingHelper.ScaleBitrate`): low bitrates are weighed higher
 */
function serverH264Equivalent(bitrate: number): number {
  if (bitrate <= 500_000) {
    return bitrate * 4;
  }

  if (bitrate <= 1_000_000) {
    return bitrate * 3;
  }

  if (bitrate <= 2_000_000) {
    return bitrate * 2.5;
  }

  return bitrate <= 3_000_000 ? bitrate * 2 : bitrate;
}

/**
 * The width the server encodes at for a video bitrate at a frame rate, capped by the requested width
 */
function serverOutputWidth(videoBitrate: number, frameRate: number, maxWidth: number): number {
  const scale = frameRate <= 30 ? 30 / frameRate : 1 / Math.sqrt(frameRate / 30);
  const reference = serverH264Equivalent(videoBitrate) * scale;
  const bracket = SERVER_WIDTH_BRACKETS.find(([, maxBitrate]) => reference <= maxBitrate);

  return bracket ? Math.min(bracket[0], maxWidth) : maxWidth;
}

/**
 * The most the server takes off the requested bitrate for the audio before it encodes the video: its default for
 * copied 5.1 AC-3 (`StreamBuilder.GetDefaultAudioBitrate`)
 */
const AUDIO_SHARE = 640_000;

describe('getLevelBitrate: a level asks for the bitrate the server needs to deliver its height at the source\'s frame rate', () => {
  const ladderBitrate = (level: QualityLevel) => getRequestCaps(level).maxBitrate;
  const cases: [string, QualityLevel, number | undefined, number][] = [
    ['without a frame rate, the level\'s internal bitrate', 1080, undefined, ladderBitrate(1080)],
    ['at 30 fps, the level\'s internal bitrate (the ladder is for 30 fps)', 1080, 30, ladderBitrate(1080)],
    ['below 30 fps, the level\'s internal bitrate (the server gives a lower frame rate more room)', 1080, 25, ladderBitrate(1080)],
    ['at 60 fps, sqrt(60 / 30) times the internal bitrate', 1080, 60, Math.round(ladderBitrate(1080) * Math.SQRT2)],
    ['at 50 fps, sqrt(50 / 30) times the internal bitrate', 1440, 50, Math.round(ladderBitrate(1440) * Math.sqrt(50 / 30))]
  ];

  test.each(cases)('%s', (_, level, frameRate, expected) => {
    expect(getLevelBitrate(level, { Width: 3840, Height: 2160, ReferenceFrameRate: frameRate })).toBe(expected);
  });

  test('the caps sent to the server carry that bitrate', () => {
    expect(getRequestCaps(1080, { Width: 1920, Height: 1080, ReferenceFrameRate: 60 }))
      .toEqual({ maxBitrate: Math.round(ladderBitrate(1080) * Math.SQRT2), maxWidth: 1920, maxHeight: 1080 });
  });

  const levels: QualityLevel[] = [2160, 1440, 1080, 720, 480, 360];
  const frameRates = [23.976, 25, 30, 48, 50, 60, 120];

  test.each(levels.flatMap(level => frameRates.map(frameRate => [level, frameRate] as const)))(
    'the server encodes level %ip of a %d fps source at the level\'s width',
    (level, frameRate) => {
      const video = { Width: 3840, Height: 2160, ReferenceFrameRate: frameRate };
      const caps = getRequestCaps(level, video);
      const width = serverOutputWidth(caps.maxBitrate - AUDIO_SHARE, frameRate, caps.maxWidth);

      expect(width).toBe(caps.maxWidth);
    }
  );
});

describe('exceedsQuality: Automatic compares the source with its level\'s bitrate at the source\'s frame rate', () => {
  test('a 1080p60 source at 10 Mbps fits its own level, which asks for 8 Mbps x sqrt(2) at 60 fps', () => {
    expect(exceedsQuality({ Width: 1920, Height: 1080, BitRate: 10_000_000, ReferenceFrameRate: 60 }, { type: 'auto', level: 1080 })).toBe(false);
  });

  test('the same source at 30 fps is above its own level\'s bitrate', () => {
    expect(exceedsQuality({ Width: 1920, Height: 1080, BitRate: 10_000_000, ReferenceFrameRate: 30 }, { type: 'auto', level: 1080 })).toBe(true);
  });
});
