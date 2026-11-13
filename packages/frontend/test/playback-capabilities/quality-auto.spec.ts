import { describe, expect, test } from 'vitest';
import { NETWORK_DOWN_FACTOR, NETWORK_RETRY_WAIT_MS, QUALITY_LADDER } from '#/utils/playback-capabilities/constants.ts';
import type { QualityLevel, VideoInfo } from '#/utils/playback-capabilities/quality.ts';
import {
  AUTO_START,
  getAutoMode,
  getAutoStartState,
  getDownStep,
  getSmoothnessStep,
  getUpStep,
  isRefused,
  keepAutoMemory,
  rememberRefusal,
  rememberStall,
  type AutoState
} from '#/utils/playback-capabilities/quality-auto.ts';
import { startNetworkMemory, stepNetwork, type NetworkEvent, type NetworkMemory } from '#/utils/playback-capabilities/runtime-signals.ts';

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
    expect(getSmoothnessStep(state, video, encodedAt, true)).toEqual(expected);
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
    expect(getDownStep(state, video, encodedAt, estimate, true)).toEqual(expected);
  });
});

describe('the steps down never propose what the user\'s policy forbids: without video transcoding there are none', () => {
  const cases: [string, AutoState, VideoInfo, QualityLevel | undefined][] = [
    ['from the original of a heavy source', AUTO_START, heavy1080, undefined],
    ['from the original of a light source', AUTO_START, light1080, undefined],
    ['from a network cap', { level: 720, encodeVideo: false }, heavy1080, 720]
  ];

  test.each(cases)('not smooth, %s: no step', (_, state, video, encodedAt) => {
    expect(getSmoothnessStep(state, video, encodedAt, false)).toBeUndefined();
  });

  test.each(cases)('the network cannot keep up, %s: no step, with or without an estimate', (_, state, video, encodedAt) => {
    const estimate = estimateFor(bitrateOf(480));

    expect([getDownStep(state, video, encodedAt, undefined, false), getDownStep(state, video, encodedAt, estimate, false)])
      .toEqual([undefined, undefined]);
  });

  test('with video transcoding allowed the same steps exist (the policy is the only difference)', () => {
    expect([getSmoothnessStep(AUTO_START, heavy1080, undefined, true), getDownStep(AUTO_START, heavy1080, undefined, undefined, true)])
      .toEqual([{ encodeVideo: true, ceiling: 'source' }, { level: 1080, encodeVideo: false }]);
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
    expect(getUpStep(state, video, encodedAt, 0)).toEqual(expected);
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
    expect(getDownStep(AUTO_START, hfr1080, undefined, estimateFor(10_000_000), true)).toEqual({ level: 720, encodeVideo: false });
  });

  test('moving up needs the 60 fps bitrate of the next level', () => {
    expect(getUpStep({ level: 480, encodeVideo: false }, hfr1080, 480, 0)).toEqual({ state: { level: 720, encodeVideo: false }, bitrate: at60(720) });
  });

  test('from 720 the next step is the source\'s own level, still above its 60 fps bitrate', () => {
    expect(getUpStep({ level: 720, encodeVideo: false }, hfr1080, 720, 0)).toEqual({ state: { level: 1080, encodeVideo: false }, bitrate: at60(1080) });
  });
});

describe('rememberStall: a stream Automatic moved down from because of stalls is not tried again for a while, longer each time', () => {
  const at = 100_000;

  test('a step down remembers the level the stream that stalled was encoded at, with the wait before it may be tried again', () => {
    const next = rememberStall({ level: 1080, encodeVideo: false }, { level: 720, encodeVideo: false }, 1080, at);

    expect(next).toEqual({ level: 720, encodeVideo: false, stalled: [{ level: 1080, retryAt: at + NETWORK_RETRY_WAIT_MS, failures: 1 }] });
  });

  test('the original (not encoded) is remembered as the top', () => {
    const next = rememberStall(AUTO_START, { level: 1080, encodeVideo: false }, undefined, at);

    expect(next.stalled).toEqual([{ level: 'top', retryAt: at + NETWORK_RETRY_WAIT_MS, failures: 1 }]);
  });

  test('an uncapped stream encoded at the source\'s own level (the codec forces it) is that level, the stream its cap asks for', () => {
    const next = rememberStall(AUTO_START, { level: 720, encodeVideo: false }, 1080, at);

    expect(next.stalled).toEqual([{ level: 1080, retryAt: at + NETWORK_RETRY_WAIT_MS, failures: 1 }]);
  });

  test('each new step down from the same stream doubles the wait', () => {
    const first = rememberStall({ level: 1080, encodeVideo: false }, { level: 720, encodeVideo: false }, 1080, at);
    const second = rememberStall({ ...first, level: 1080 }, { ...first, level: 720 }, 1080, at + 500_000);
    const third = rememberStall({ ...second, level: 1080 }, { ...second, level: 720 }, 1080, at + 1_000_000);

    expect(third.stalled).toEqual([{ level: 1080, retryAt: at + 1_000_000 + (4 * NETWORK_RETRY_WAIT_MS), failures: 3 }]);
  });

  test('other streams keep their own memory', () => {
    const first = rememberStall({ level: 1080, encodeVideo: false }, { level: 720, encodeVideo: false }, 1080, at);
    const second = rememberStall(first, { ...first, level: 480 }, 720, at + 1000);

    expect(second.stalled).toEqual([
      { level: 1080, retryAt: at + NETWORK_RETRY_WAIT_MS, failures: 1 },
      { level: 720, retryAt: at + 1000 + NETWORK_RETRY_WAIT_MS, failures: 1 }
    ]);
  });
});

describe('getUpStep after a stall: the stream that stalled, and any above it, is not offered before its time', () => {
  const at = 100_000;
  const stalled1080 = rememberStall({ level: 1080, encodeVideo: false }, { level: 720, encodeVideo: false }, 1080, at);

  test('before the wait is over there is no step up to it', () => {
    expect(getUpStep(stalled1080, heavy1080, 720, at + NETWORK_RETRY_WAIT_MS - 1)).toBeUndefined();
  });

  test('once the wait is over it is offered again, with its bitrate', () => {
    expect(getUpStep(stalled1080, heavy1080, 720, at + NETWORK_RETRY_WAIT_MS)).toEqual({
      state: { ...stalled1080, level: 1080 },
      bitrate: bitrateOf(1080)
    });
  });

  test('levels below the one that stalled go up as before', () => {
    expect(getUpStep({ ...stalled1080, level: 480 }, heavy1080, 480, at)?.state.level).toBe(720);
  });

  test('the uncapped stream encoded at the source\'s own level stalled: the cap at that level waits too (the same stream)', () => {
    const stalledUncapped = rememberStall(AUTO_START, { level: 720, encodeVideo: false }, 1080, at);

    expect(getUpStep(stalledUncapped, heavy1080, 720, at)).toBeUndefined();
  });

  test('nothing above the stream that stalled is offered either: going higher asks more of whatever stalled', () => {
    const stalled720 = rememberStall({ level: 720, encodeVideo: false }, { level: 480, encodeVideo: false }, 720, at);

    expect(getUpStep({ ...stalled720, level: 720 }, heavy1080, 720, at)).toBeUndefined();
  });

  test('when the original stalled, the levels below it go up as before and only the original waits', () => {
    const stalledTop = rememberStall(AUTO_START, { level: 1080, encodeVideo: false }, undefined, at);

    expect([
      getUpStep({ ...stalledTop, level: 720 }, heavy1080, 720, at)?.state.level,
      getUpStep(stalledTop, heavy1080, 1080, at),
      getUpStep(stalledTop, heavy1080, 1080, at + NETWORK_RETRY_WAIT_MS)?.state
    ]).toEqual([1080, undefined, { encodeVideo: false, stalled: stalledTop.stalled }]);
  });

  test('a smoothness step keeps the memory', () => {
    expect(getSmoothnessStep(stalled1080, heavy1080, 720, true)?.stalled).toEqual(stalled1080.stalled);
  });
});

describe('Automatic when the server, not the network, is the limit', () => {
  /**
   * The network supervisor and Automatic over `durationMs`, one event per second, in a world where the server encodes
   * the 1080 level slower than real time (a 1.5 s stall every 15 s) and the 720 level ahead of time (the estimate there
   * measures a fast network, 25 Mbit/s; the buffer refills within 15 s of a change). Hunter C's scenario.
   *
   * @returns When Automatic moved up to 1080 and back down
   */
  function simulate(durationMs: number): { ups: number[]; downs: number[] } {
    let state: AutoState = { level: 720, encodeVideo: false };
    let memory: NetworkMemory = startNetworkMemory(0);
    let changedAt = 0;
    const ups: number[] = [];
    const downs: number[] = [];

    for (let at = 1000; at <= durationMs; at += 1000) {
      const encodedAt = state.level ?? 1080;
      const sinceChange = at - changedAt;
      const event: NetworkEvent = encodedAt === 1080 && sinceChange % 15_000 === 0
        ? { type: 'stall', startedAt: at - 1500, at, ended: true }
        : {
            type: 'sample',
            at,
            paused: false,
            estimate: encodedAt === 1080 ? 7_000_000 : 25_000_000,
            bufferAhead: Math.min(30, sinceChange / 500),
            upBitrate: getUpStep(state, heavy1080, encodedAt, at)?.bitrate
          };
      const result = stepNetwork(memory, event);

      memory = result.memory;

      if (result.decision === 'up') {
        state = getUpStep(state, heavy1080, encodedAt, at)!.state;
        ups.push(at);
      } else if (result.decision === 'down') {
        state = rememberStall(state, getDownStep(state, heavy1080, encodedAt, 7_000_000, true)!, encodedAt, at);
        downs.push(at);
      }

      if (result.decision) {
        memory = startNetworkMemory(at);
        changedAt = at;
      }
    }

    return { ups, downs };
  }

  test('after each step down the level that stalled waits twice as long as the time before to be tried again', () => {
    const { ups, downs } = simulate(3_600_000);
    const waits = ups.slice(1).map((up, index) => up - downs[index]!);

    expect(waits.length).toBeGreaterThan(1);
    expect(waits.every((wait, index) => wait >= NETWORK_RETRY_WAIT_MS * (2 ** index))).toBe(true);
  });

  test('so in an hour it is tried a handful of times instead of every time the margin holds', () => {
    const { ups } = simulate(3_600_000);

    expect(ups.length).toBeLessThanOrEqual(6);
  });
});

describe('keepAutoMemory and rememberRefusal: a step the playback manager did not take goes back to the playing state, and one that gave nothing playable is not asked for again for a while', () => {
  const at = 100_000;
  const playing: AutoState = { level: 720, encodeVideo: false };
  const step = getDownStep(playing, heavy1080, 720, undefined, true)!;

  test('the playback goes on at the state it runs at', () => {
    const back = keepAutoMemory(playing, step);

    expect([back.level, back.encodeVideo]).toEqual([720, false]);
  });

  test('what Automatic remembered while the step was under way is kept: the streams the network supervisor moved down from', () => {
    const stalledStep = rememberStall(playing, step, 720, at);

    expect(keepAutoMemory(playing, stalledStep).stalled).toEqual(stalledStep.stalled);
  });

  test('a step refused as unplayable is not proposed again before the wait, and is after it', () => {
    const back = rememberRefusal(keepAutoMemory(playing, step), step, at);

    expect([isRefused(back, step, at + NETWORK_RETRY_WAIT_MS - 1), isRefused(back, step, at + NETWORK_RETRY_WAIT_MS)]).toEqual([true, false]);
  });

  test('each new refusal of the same step doubles the wait, so asking again is bounded however often it is refused', () => {
    let state = playing;
    let now = at;
    const waits: number[] = [];

    for (let refusal = 0; refusal < 4; refusal++) {
      state = rememberRefusal(state, step, now);

      const retryAt = state.refused!.find(entry => entry.refusals === refusal + 1)!.retryAt;

      waits.push(retryAt - now);
      now = retryAt;
    }

    expect(waits).toEqual([1, 2, 4, 8].map(factor => factor * NETWORK_RETRY_WAIT_MS));
  });

  test('other steps are not held back by it', () => {
    const back = rememberRefusal(playing, step, at);
    const smoothness = getSmoothnessStep(back, heavy1080, 720, true)!;

    expect(isRefused(back, smoothness, at)).toBe(false);
  });

  test('earlier refusals are kept when the playing state does not know them yet', () => {
    const first = rememberRefusal(playing, step, at);
    const up = { ...first, level: 1080 as const };
    const second = rememberRefusal(keepAutoMemory(playing, up), up, at + 1000);

    expect(second.refused?.map(entry => entry.refusals)).toEqual([1, 1]);
  });

  test('a state that asks for nothing new records no refusal', () => {
    expect(rememberRefusal(playing, playing, at)).toBe(playing);
  });

  test('the steps carry the memory on: smoothness, down and up', () => {
    const back = rememberRefusal(playing, step, at);

    expect([
      getSmoothnessStep(back, heavy1080, 720, true)?.refused,
      getDownStep(back, heavy1080, 720, undefined, true)?.refused,
      getUpStep({ ...back, level: 1080 }, heavy1080, 1080, at)?.state.refused
    ]).toEqual([back.refused, back.refused, back.refused]);
  });
});
