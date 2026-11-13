import { describe, expect, test } from 'vitest';
import { NETWORK_DOWN_FACTOR, QUALITY_LADDER } from '#/utils/playback-capabilities/constants.ts';
import type { QualityLevel, VideoInfo } from '#/utils/playback-capabilities/quality.ts';
import {
  AUTO_START,
  getAutoMode,
  getAutoStartState,
  getDownStep,
  getSmoothnessStep,
  getUpStep,
  type AutoState
} from '#/utils/playback-capabilities/quality-auto.ts';

/**
 * Shorthand for a video stream
 */
function size(width: number, height: number, bitrate?: number): VideoInfo {
  return { Width: width, Height: height, BitRate: bitrate };
}

/**
 * The internal bitrate of a level
 */
function bitrateOf(level: QualityLevel): number {
  return QUALITY_LADDER.find(entry => entry.height === level)!.bitrate;
}

/**
 * The estimate that makes exactly a given bitrate usable when choosing a level
 */
function estimateFor(bitrate: number): number {
  return bitrate / NETWORK_DOWN_FACTOR;
}

/**
 * A 1080p source whose bitrate (10 Mbps) is above the 1080 level's (8 Mbps): its own level at the ladder bitrate is a step
 */
const heavy1080 = size(1920, 1080, 10_000_000);
/**
 * A 1080p source whose bitrate (6 Mbps) is below the 1080 level's
 */
const light1080 = size(1920, 1080, 6_000_000);

describe('getAutoMode: the quality mode a state of Automatic means', () => {
  const cases: [string, AutoState, ReturnType<typeof getAutoMode>][] = [
    ['the start has no cap and encodes nothing by itself', AUTO_START, { type: 'auto' }],
    ['a network cap is a level', { level: 720, encodeVideo: false }, { type: 'auto', level: 720 }],
    ['after a smoothness step the video is encoded', { level: 720, encodeVideo: true, ceiling: 720 }, { type: 'auto', level: 720, encodeVideo: true }],
    ['encoded at the source\'s own level', { encodeVideo: true, ceiling: 'source' }, { type: 'auto', encodeVideo: true }]
  ];

  test.each(cases)('%s', (_, state, expected) => {
    expect(getAutoMode(state)).toEqual(expected);
  });
});

describe('getAutoStartState: a new playback starts from the network estimate remembered for the session', () => {
  const cases: [string, VideoInfo | undefined, number | undefined, AutoState][] = [
    ['without an estimate there is no cap', heavy1080, undefined, AUTO_START],
    ['music has no levels', undefined, 1000, AUTO_START],
    ['an estimate that carries the source\'s bitrate does not cap', heavy1080, estimateFor(10_000_000), AUTO_START],
    [
      'an estimate below the source but above its own level\'s bitrate starts at the source\'s own level at the ladder bitrate',
      heavy1080, estimateFor(bitrateOf(1080)), { level: 1080, encodeVideo: false }
    ],
    ['otherwise the highest level whose bitrate fits', heavy1080, estimateFor(bitrateOf(480)) + 1, { level: 480, encodeVideo: false }],
    ['a light source never starts at its own level (it would be the original)', light1080, estimateFor(5_000_000), { level: 720, encodeVideo: false }],
    ['an estimate below every level starts at the lowest one', heavy1080, 10_000, { level: 360, encodeVideo: false }],
    ['a source of unknown bitrate is not capped when its own level fits', size(1280, 720), estimateFor(bitrateOf(720)), AUTO_START],
    ['a source of unknown bitrate is capped below its own level when it does not fit', size(1280, 720), estimateFor(bitrateOf(480)), { level: 480, encodeVideo: false }]
  ];

  test.each(cases)('%s', (_, video, estimate, expected) => {
    expect(getAutoStartState(video, estimate)).toEqual(expected);
  });
});

describe('getSmoothnessStep: not smooth in Automatic: first the video encoded at the same resolution, then one level at a time', () => {
  const cases: [string, AutoState, VideoInfo | undefined, QualityLevel | undefined, AutoState | undefined][] = [
    [
      'the original (picture not encoded) is first encoded at the same resolution, and never goes back above it',
      AUTO_START, light1080, undefined, { encodeVideo: true, ceiling: 'source' }
    ],
    [
      'a network cap that still plays the original is kept as the resolution to encode at',
      { level: 1080, encodeVideo: false }, light1080, undefined, { level: 1080, encodeVideo: true, ceiling: 1080 }
    ],
    ['an encoded video goes one level down', { encodeVideo: true, ceiling: 'source' }, light1080, 1080, { level: 720, encodeVideo: true, ceiling: 720 }],
    ['a network cap being encoded goes one level down too', { level: 720, encodeVideo: false }, heavy1080, 720, { level: 480, encodeVideo: true, ceiling: 480 }],
    ['nothing is below the lowest level', { level: 360, encodeVideo: true, ceiling: 360 }, heavy1080, 360, undefined],
    ['music has no smoothness steps', AUTO_START, undefined, undefined, undefined]
  ];

  test.each(cases)('%s', (_, state, video, encodedAt, expected) => {
    expect(getSmoothnessStep(state, video, encodedAt)).toEqual(expected);
  });
});

describe('getDownStep: the network cannot keep up: below what is playing, to the level the estimate carries', () => {
  const cases: [string, AutoState, VideoInfo, QualityLevel | undefined, number | undefined, AutoState | undefined][] = [
    ['from the original without an estimate: one step (the source\'s own level of a heavy source)', AUTO_START, heavy1080, undefined, undefined, { level: 1080, encodeVideo: false }],
    ['from the original of a light source the first step is the level below', AUTO_START, light1080, undefined, undefined, { level: 720, encodeVideo: false }],
    ['from an encoded level without an estimate: one level down', { level: 720, encodeVideo: false }, heavy1080, 720, undefined, { level: 480, encodeVideo: false }],
    ['with an estimate: straight to the highest level it carries', AUTO_START, heavy1080, undefined, estimateFor(bitrateOf(480)), { level: 480, encodeVideo: false }],
    ['always below what is playing, even if the estimate carries more', { level: 720, encodeVideo: false }, heavy1080, 720, estimateFor(20_000_000), { level: 480, encodeVideo: false }],
    ['an estimate below every level goes to the lowest one', AUTO_START, heavy1080, undefined, 10_000, { level: 360, encodeVideo: false }],
    ['nothing is below the lowest level', { level: 360, encodeVideo: false }, heavy1080, 360, undefined, undefined],
    [
      'a smoothness state keeps its encoding and ceiling',
      { level: 720, encodeVideo: true, ceiling: 720 }, heavy1080, 720, undefined, { level: 480, encodeVideo: true, ceiling: 720 }
    ]
  ];

  test.each(cases)('%s', (_, state, video, encodedAt, estimate, expected) => {
    expect(getDownStep(state, video, encodedAt, estimate)).toEqual(expected);
  });
});

describe('getUpStep: one step up, with the bitrate the network must carry for it', () => {
  const cases: [string, AutoState, VideoInfo, QualityLevel | undefined, ReturnType<typeof getUpStep>][] = [
    ['the original has nothing above', AUTO_START, heavy1080, undefined, undefined],
    ['from 480: 720 at its internal bitrate', { level: 480, encodeVideo: false }, heavy1080, 480, { state: { level: 720, encodeVideo: false }, bitrate: bitrateOf(720) }],
    [
      'from 720 of a heavy source: its own level at the ladder bitrate',
      { level: 720, encodeVideo: false }, heavy1080, 720, { state: { level: 1080, encodeVideo: false }, bitrate: bitrateOf(1080) }
    ],
    ['from the source\'s own level: back to the original, at the source\'s bitrate', { level: 1080, encodeVideo: false }, heavy1080, 1080, { state: AUTO_START, bitrate: 10_000_000 }],
    ['a light source goes from the level below straight to the original', { level: 720, encodeVideo: false }, light1080, 720, { state: AUTO_START, bitrate: 6_000_000 }],
    [
      'a level\'s bitrate never counts above the source\'s (the server does not encode above it)',
      { level: 480, encodeVideo: false }, size(1920, 1080, 3_000_000), 480, { state: { level: 720, encodeVideo: false }, bitrate: 3_000_000 }
    ],
    ['smoothness lowered it: never above its ceiling', { level: 720, encodeVideo: true, ceiling: 720 }, heavy1080, 720, undefined],
    [
      'below the ceiling it goes up to it',
      { level: 480, encodeVideo: true, ceiling: 720 }, heavy1080, 480, { state: { level: 720, encodeVideo: true, ceiling: 720 }, bitrate: bitrateOf(720) }
    ],
    [
      'with the source as ceiling it goes back to the source\'s own level, still encoded',
      { level: 720, encodeVideo: true, ceiling: 'source' }, light1080, 720, { state: { encodeVideo: true, ceiling: 'source' }, bitrate: 6_000_000 }
    ],
    ['at the source as ceiling there is nothing above', { encodeVideo: true, ceiling: 'source' }, light1080, 1080, undefined],
    [
      'a video encoded for another reason (its codec) without a cap has nothing above: going up would ask for the same stream',
      AUTO_START, size(1280, 720, 1_600_000), 720, undefined
    ]
  ];

  test.each(cases)('%s', (_, state, video, encodedAt, expected) => {
    expect(getUpStep(state, video, encodedAt)).toEqual(expected);
  });
});

describe('Automatic weighs the network against the bitrate each level asks for at the source\'s frame rate', () => {
  /**
   * A 1080p60 source at 12 Mbps: its own level asks for 8 Mbps x sqrt(2) = 11.3 Mbps, 720p for 5 Mbps x sqrt(2)
   */
  const hfr1080 = { Width: 1920, Height: 1080, BitRate: 12_000_000, ReferenceFrameRate: 60 };
  const at60 = (level: QualityLevel) => Math.round(bitrateOf(level) * Math.SQRT2);

  test('a new playback starts at the highest level whose 60 fps bitrate the estimate carries', () => {
    expect(getAutoStartState(hfr1080, estimateFor(10_000_000))).toEqual({ level: 720, encodeVideo: false });
  });

  test('moving down picks by the 60 fps bitrates', () => {
    expect(getDownStep(AUTO_START, hfr1080, undefined, estimateFor(10_000_000))).toEqual({ level: 720, encodeVideo: false });
  });

  test('moving up needs the 60 fps bitrate of the next level', () => {
    expect(getUpStep({ level: 480, encodeVideo: false }, hfr1080, 480)).toEqual({ state: { level: 720, encodeVideo: false }, bitrate: at60(720) });
  });

  test('from 720 the next step is the source\'s own level, still above its 60 fps bitrate', () => {
    expect(getUpStep({ level: 720, encodeVideo: false }, hfr1080, 720)).toEqual({ state: { level: 1080, encodeVideo: false }, bitrate: at60(1080) });
  });
});
