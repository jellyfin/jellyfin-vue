import { describe, expect, test } from 'vitest';
import {
  BUFFER_POSITION_TOLERANCE_S,
  DROPPED_FRAMES_CONSECUTIVE_WINDOWS,
  DROPPED_FRAMES_RATIO,
  FRAMES_STALL_MEDIA_SECONDS,
  HLS_MANIFEST_RELOADS,
  HLS_NETWORK_RECOVERY_DELAY_MS,
  HLS_STREAM_RESUMES,
  NETWORK_LONG_STALL_MS,
  NETWORK_STALL_COUNT,
  NETWORK_STALL_MIN_MS,
  NETWORK_STALL_WINDOW_MS,
  NETWORK_UP_FACTOR,
  NETWORK_UP_HOLD_MS,
  NETWORK_UP_MIN_BUFFER_S,
  NETWORK_UP_SUSTAIN_MS
} from '#/utils/playback-capabilities/constants.ts';
import {
  getBufferedAhead,
  getNetworkRecovery,
  isNotSmooth,
  NO_NETWORK_ATTEMPTS,
  startNetworkMemory,
  stepFrameProgress,
  stepNetwork,
  stepNetworkRecovery,
  type FrameProgress,
  type FrameProgressSample,
  type FrameWindow,
  type LoadFailure,
  type NetworkAttempts,
  type NetworkDecision,
  type NetworkEvent,
  type NetworkMemory,
  type NetworkRecovery
} from '#/utils/playback-capabilities/runtime-signals.ts';

/**
 * == SMOOTHNESS ==
 */

/**
 * A window of 125 frames (5 s at 25 fps) dropping the given share of them
 */
function frameWindow(droppedShare: number, valid = true): FrameWindow {
  const totalFrames = 125;

  return { totalFrames, droppedFrames: Math.round(totalFrames * droppedShare), valid };
}

const ABOVE = DROPPED_FRAMES_RATIO + 0.1;
const BELOW = DROPPED_FRAMES_RATIO - 0.1;

describe('isNotSmooth: more than the dropped frames ratio in consecutive windows while visible', () => {
  test('the rule is the owner\'s: more than 20 % in two windows in a row', () => {
    expect([DROPPED_FRAMES_RATIO, DROPPED_FRAMES_CONSECUTIVE_WINDOWS]).toEqual([0.2, 2]);
  });

  const cases: [string, FrameWindow[], boolean][] = [
    ['two windows in a row above the ratio are not smooth', [frameWindow(ABOVE), frameWindow(ABOVE)], true],
    ['one window above the ratio is not enough', [frameWindow(ABOVE)], false],
    ['the windows must be consecutive', [frameWindow(ABOVE), frameWindow(BELOW), frameWindow(ABOVE)], false],
    ['only the latest windows count', [frameWindow(ABOVE), frameWindow(ABOVE), frameWindow(BELOW)], false],
    ['earlier smooth windows do not hide two bad ones at the end', [frameWindow(BELOW), frameWindow(ABOVE), frameWindow(ABOVE)], true],
    ['exactly the ratio is smooth ("more than")', [frameWindow(DROPPED_FRAMES_RATIO), frameWindow(DROPPED_FRAMES_RATIO)], false],
    [
      'a window that was not fully observed (tab hidden, paused, seeking, another source) breaks the streak',
      [frameWindow(ABOVE), frameWindow(ABOVE, false), frameWindow(ABOVE)],
      false
    ],
    ['a window without frames cannot be judged', [frameWindow(ABOVE), { totalFrames: 0, droppedFrames: 0, valid: true }], false],
    ['no windows yet is smooth', [], false]
  ];

  test.each(cases)('%s', (_, windows, expected) => {
    const result = isNotSmooth(windows);

    expect(result).toBe(expected);
  });
});

/**
 * == VIDEO PRODUCES NO FRAMES ==
 */

/**
 * Feeds samples to the frame progress detector and returns whether it fired at each step
 */
function runFrames(samples: FrameProgressSample[]): boolean[] {
  let progress: FrameProgress | undefined;

  return samples.map((sample) => {
    const result = stepFrameProgress(progress, sample);

    progress = result.progress;

    return result.stalled;
  });
}

/**
 * Samples every half second of media time, each saying whether a frame was presented since the load started
 */
function timeline(seconds: number, presented: (index: number) => boolean, from = 0, valid = true): FrameProgressSample[] {
  return Array.from({ length: (seconds * 2) + 1 }, (_, index) => ({ mediaTime: from + (index / 2), presented: presented(index), valid }));
}

const NEVER = (): boolean => false;
const ALWAYS = (): boolean => true;

describe('stepFrameProgress: no video frame was ever presented since the load started while the media time advanced', () => {
  test('no frame at all while the time advances (a browser that claimed a codec it cannot decode) fires once the threshold of media time is reached', () => {
    const fired = runFrames(timeline(FRAMES_STALL_MEDIA_SECONDS + 1, NEVER));
    const firstFired = fired.indexOf(true) / 2;

    expect(firstFired).toBe(FRAMES_STALL_MEDIA_SECONDS);
  });

  test('a frame presented at the start never fires, however long the video goes without another (stills, slideshows, one frame every 10 s)', () => {
    const fired = runFrames(timeline(FRAMES_STALL_MEDIA_SECONDS * 20, ALWAYS));

    expect(fired.some(Boolean)).toBe(false);
  });

  test('the same from a resume position in the middle, or after a seek', () => {
    const resumed = runFrames(timeline(FRAMES_STALL_MEDIA_SECONDS * 5, ALWAYS, 25));
    const seeked = runFrames([...timeline(5, ALWAYS, 0), ...timeline(FRAMES_STALL_MEDIA_SECONDS * 5, ALWAYS, 35)]);

    expect([resumed.some(Boolean), seeked.some(Boolean)]).toEqual([false, false]);
  });

  test('a first frame presented a little after the start, before the threshold, does not fire', () => {
    const fired = runFrames(timeline(FRAMES_STALL_MEDIA_SECONDS * 4, index => index / 2 >= FRAMES_STALL_MEDIA_SECONDS - 1));

    expect(fired.some(Boolean)).toBe(false);
  });

  test('frames that stop once the video presented one do not fire: a decoder that dies on the way raises a media error', () => {
    const fired = runFrames(timeline(FRAMES_STALL_MEDIA_SECONDS * 4, index => index >= 1));

    expect(fired.some(Boolean)).toBe(false);
  });

  test('no frame while the media time does not advance (paused) does not fire', () => {
    const paused = Array.from({ length: 40 }, () => ({ mediaTime: 3, presented: false, valid: true }));

    expect(runFrames(paused).some(Boolean)).toBe(false);
  });

  test('a sample that cannot be trusted (tab hidden, seeking) starts the count again', () => {
    const half = FRAMES_STALL_MEDIA_SECONDS / 2;
    const samples = [
      ...timeline(half + 0.5, NEVER),
      { mediaTime: half + 1, presented: false, valid: false },
      ...timeline(half + 0.5, NEVER, half + 1.5)
    ];

    expect(runFrames(samples).some(Boolean)).toBe(false);
  });

  test('the media time going backwards (a seek) starts the count again', () => {
    const samples = [...timeline(FRAMES_STALL_MEDIA_SECONDS - 0.5, NEVER, 20), ...timeline(FRAMES_STALL_MEDIA_SECONDS - 0.5, NEVER, 5)];

    expect(runFrames(samples).some(Boolean)).toBe(false);
  });
});

/**
 * == NETWORK ==
 */

/**
 * Feeds events to the network supervisor's logic and returns the decisions with their times
 */
function runNetwork(events: NetworkEvent[], start = 0): { at: number; decision: NetworkDecision }[] {
  let memory: NetworkMemory = startNetworkMemory(start);
  const decisions: { at: number; decision: NetworkDecision }[] = [];

  for (const event of events) {
    const result = stepNetwork(memory, event);

    memory = result.memory;

    if (result.decision) {
      decisions.push({ at: event.at, decision: result.decision });
    }
  }

  return decisions;
}

/**
 * A buffering stall that started at `startedAt` and lasted `durationMs`, reported when it ended
 */
function stall(startedAt: number, durationMs: number): NetworkEvent {
  return { type: 'stall', startedAt, at: startedAt + durationMs, ended: true };
}

const LEVEL_BITRATE = 2_500_000;

/**
 * One sample per second from `from` to `to` (inclusive), with the given estimate and buffer ahead. The next level up
 * needs {@link LEVEL_BITRATE} unless `upBitrate` says otherwise (`none`: there is no level above).
 */
function samples(
  from: number,
  to: number,
  estimate: number | undefined,
  bufferAhead: number,
  upBitrate: number | 'none' = LEVEL_BITRATE,
  paused = false
): NetworkEvent[] {
  const events: NetworkEvent[] = [];

  for (let at = from; at <= to; at += 1000) {
    events.push({ type: 'sample', at, paused, estimate, bufferAhead, upBitrate: upBitrate === 'none' ? undefined : upBitrate });
  }

  return events;
}

const GOOD = NETWORK_UP_FACTOR * LEVEL_BITRATE * 1.1;
const FULL = NETWORK_UP_MIN_BUFFER_S + 5;

describe('stepNetwork, down: buffering stalls that are not caused by a seek', () => {
  test(`${NETWORK_STALL_COUNT} stalls within the window move down`, () => {
    const events = Array.from({ length: NETWORK_STALL_COUNT }, (_, index) => stall(10_000 + (index * 1000), NETWORK_STALL_MIN_MS));
    const decisions = runNetwork(events);

    expect(decisions).toEqual([{ at: events.at(-1)!.at, decision: 'down' }]);
  });

  test('stalls further apart than the window do not', () => {
    const events = Array.from({ length: NETWORK_STALL_COUNT }, (_, index) => stall(10_000 + (index * (NETWORK_STALL_WINDOW_MS + 1000)), NETWORK_STALL_MIN_MS));
    const decisions = runNetwork(events);

    expect(decisions).toEqual([]);
  });

  test('stalls shorter than the minimum do not count', () => {
    const events = Array.from({ length: NETWORK_STALL_COUNT * 3 }, (_, index) => stall(10_000 + (index * 1000), NETWORK_STALL_MIN_MS - 1));
    const decisions = runNetwork(events);

    expect(decisions).toEqual([]);
  });

  test('one stall that lasts the long stall threshold moves down while it is still going on, once', () => {
    const events: NetworkEvent[] = [
      { type: 'stall', startedAt: 10_000, at: 10_000 + NETWORK_LONG_STALL_MS - 1, ended: false },
      { type: 'stall', startedAt: 10_000, at: 10_000 + NETWORK_LONG_STALL_MS, ended: false },
      { type: 'stall', startedAt: 10_000, at: 10_000 + NETWORK_LONG_STALL_MS + 1000, ended: false },
      { type: 'stall', startedAt: 10_000, at: 10_000 + NETWORK_LONG_STALL_MS + 2000, ended: true }
    ];
    const decisions = runNetwork(events);

    expect(decisions).toEqual([{ at: 10_000 + NETWORK_LONG_STALL_MS, decision: 'down' }]);
  });

  test('after moving down the count starts again', () => {
    const first = Array.from({ length: NETWORK_STALL_COUNT }, (_, index) => stall(10_000 + (index * 1000), NETWORK_STALL_MIN_MS));
    const next = stall(10_000 + (NETWORK_STALL_COUNT * 1000), NETWORK_STALL_MIN_MS);
    const decisions = runNetwork([...first, next]);

    expect(decisions.map(entry => entry.decision)).toEqual(['down']);
  });
});

describe('stepNetwork, up: the estimate and the buffer keep a margin over the next level for a sustained time', () => {
  const start = NETWORK_UP_HOLD_MS;

  test('a margin sustained for the whole sustain time moves up, once', () => {
    const decisions = runNetwork(samples(start, start + NETWORK_UP_SUSTAIN_MS + 5000, GOOD, FULL));

    expect(decisions).toEqual([{ at: start + NETWORK_UP_SUSTAIN_MS, decision: 'up' }]);
  });

  test('an estimate below the up factor never moves up (hysteresis)', () => {
    const decisions = runNetwork(samples(start, start + (NETWORK_UP_SUSTAIN_MS * 3), NETWORK_UP_FACTOR * LEVEL_BITRATE * 0.99, FULL));

    expect(decisions).toEqual([]);
  });

  test('a short buffer never moves up', () => {
    const decisions = runNetwork(samples(start, start + (NETWORK_UP_SUSTAIN_MS * 3), GOOD, NETWORK_UP_MIN_BUFFER_S - 1));

    expect(decisions).toEqual([]);
  });

  test('without an estimate it never moves up', () => {
    const decisions = runNetwork(samples(start, start + (NETWORK_UP_SUSTAIN_MS * 3), undefined, FULL));

    expect(decisions).toEqual([]);
  });

  test('without a level above it never moves up', () => {
    const decisions = runNetwork(samples(start, start + (NETWORK_UP_SUSTAIN_MS * 3), GOOD, FULL, 'none'));

    expect(decisions).toEqual([]);
  });

  test('a sample without the margin starts the sustain time again', () => {
    const half = start + (NETWORK_UP_SUSTAIN_MS / 2);
    const events = [
      ...samples(start, half, GOOD, FULL),
      ...samples(half + 1000, half + 1000, LEVEL_BITRATE, FULL),
      ...samples(half + 2000, half + 2000 + NETWORK_UP_SUSTAIN_MS, GOOD, FULL)
    ];
    const decisions = runNetwork(events);

    expect(decisions).toEqual([{ at: half + 2000 + NETWORK_UP_SUSTAIN_MS, decision: 'up' }]);
  });

  test('a stall starts the sustain time again', () => {
    const half = start + (NETWORK_UP_SUSTAIN_MS / 2);
    const events = [
      ...samples(start, half, GOOD, FULL),
      stall(half + 100, NETWORK_STALL_MIN_MS),
      ...samples(half + 1000, half + 1000 + NETWORK_UP_SUSTAIN_MS, GOOD, FULL)
    ];
    const decisions = runNetwork(events);

    expect(decisions).toEqual([{ at: half + 1000 + NETWORK_UP_SUSTAIN_MS, decision: 'up' }]);
  });

  test('a paused playback never moves up, however long its buffer and estimate keep the margin', () => {
    const decisions = runNetwork(samples(start, start + (NETWORK_UP_SUSTAIN_MS * 5), GOOD, FULL, LEVEL_BITRATE, true));

    expect(decisions).toEqual([]);
  });

  test('a pause starts the sustain time again: the margin counts from the resume', () => {
    const half = start + (NETWORK_UP_SUSTAIN_MS / 2);
    const resumeAt = half + (NETWORK_UP_SUSTAIN_MS * 3);
    const events = [
      ...samples(start, half, GOOD, FULL),
      ...samples(half + 1000, resumeAt - 1000, GOOD, FULL, LEVEL_BITRATE, true),
      ...samples(resumeAt, resumeAt + NETWORK_UP_SUSTAIN_MS + 5000, GOOD, FULL)
    ];
    const decisions = runNetwork(events);

    expect(decisions).toEqual([{ at: resumeAt + NETWORK_UP_SUSTAIN_MS, decision: 'up' }]);
  });

  test('it never moves up sooner than the hold time after the last change', () => {
    const decisions = runNetwork(samples(0, NETWORK_UP_HOLD_MS + NETWORK_UP_SUSTAIN_MS, GOOD, FULL), 0);

    expect(decisions).toEqual([{ at: Math.max(NETWORK_UP_HOLD_MS, NETWORK_UP_SUSTAIN_MS), decision: 'up' }]);
  });

  test('after moving down, moving back up waits for the hold time and the sustain time (no oscillation)', () => {
    const downAt = 10_000 + ((NETWORK_STALL_COUNT - 1) * 1000) + NETWORK_STALL_MIN_MS;
    const events = [
      ...Array.from({ length: NETWORK_STALL_COUNT }, (_, index) => stall(10_000 + (index * 1000), NETWORK_STALL_MIN_MS)),
      ...samples(downAt + 1000, downAt + NETWORK_UP_HOLD_MS + NETWORK_UP_SUSTAIN_MS + 1000, GOOD, FULL)
    ];
    const decisions = runNetwork(events);
    const up = decisions.find(entry => entry.decision === 'up');

    expect(up && up.at - downAt).toBeGreaterThanOrEqual(Math.max(NETWORK_UP_HOLD_MS, NETWORK_UP_SUSTAIN_MS));
  });
});

describe('getNetworkRecovery: a stream that stops loading is tried again a bounded number of times, then the playback ends', () => {
  test('a manifest that failed is loaded again: resuming the load cannot recover it (there is nothing to resume)', () => {
    expect(getNetworkRecovery('manifest', 0)).toEqual({ action: 'reload', delayMs: HLS_NETWORK_RECOVERY_DELAY_MS });
  });

  test('a manifest is loaded again up to its bound, each time after twice the wait of the time before', () => {
    const steps = Array.from({ length: HLS_MANIFEST_RELOADS }, (_, attempt) => getNetworkRecovery('manifest', attempt));

    expect(steps).toEqual(Array.from({ length: HLS_MANIFEST_RELOADS }, (_, attempt) =>
      ({ action: 'reload', delayMs: HLS_NETWORK_RECOVERY_DELAY_MS * 2 ** attempt })));
  });

  test('a playlist or fragment that failed (after hls.js\'s own retries) resumes the load where it stopped, keeping what is buffered', () => {
    expect(getNetworkRecovery('stream', 0)).toEqual({ action: 'resume', delayMs: HLS_NETWORK_RECOVERY_DELAY_MS });
  });

  test('after the last attempt the playback stops, so the player never stays frozen', () => {
    expect(getNetworkRecovery('manifest', HLS_MANIFEST_RELOADS)).toEqual({ action: 'stop' });
    expect(getNetworkRecovery('stream', HLS_STREAM_RESUMES)).toEqual({ action: 'stop' });
  });
});

describe('stepNetworkRecovery: each kind of failure has its own bounded allowance', () => {
  /**
   * The actions taken for a sequence of failures, from no attempt, until the first stop
   */
  function actions(failures: LoadFailure[]): NetworkRecovery['action'][] {
    let attempts: NetworkAttempts = NO_NETWORK_ATTEMPTS;
    const taken: NetworkRecovery['action'][] = [];

    for (const failure of failures) {
      const step = stepNetworkRecovery(attempts, failure);

      attempts = step.attempts;
      taken.push(step.recovery.action);

      if (step.recovery.action === 'stop') {
        break;
      }
    }

    return taken;
  }

  test('a manifest that failed once and was loaded again does not spend the resume of a stream that fails after it', () => {
    expect(actions(['manifest', 'stream'])).toEqual(['reload', 'resume']);
  });

  test('the resume of a stream after a manifest reload waits the first delay, not the doubled one', () => {
    const afterReload = stepNetworkRecovery(NO_NETWORK_ATTEMPTS, 'manifest').attempts;

    expect(stepNetworkRecovery(afterReload, 'stream').recovery).toEqual({ action: 'resume', delayMs: HLS_NETWORK_RECOVERY_DELAY_MS });
  });

  test('a manifest that always fails is loaded again up to its bound, then the playback stops', () => {
    expect(actions(Array.from({ length: HLS_MANIFEST_RELOADS + 3 }, () => 'manifest')))
      .toEqual([...Array.from({ length: HLS_MANIFEST_RELOADS }, () => 'reload'), 'stop']);
  });

  test('a stream that always fails is resumed up to its bound, then the playback stops', () => {
    expect(actions(Array.from({ length: HLS_STREAM_RESUMES + 3 }, () => 'stream')))
      .toEqual([...Array.from({ length: HLS_STREAM_RESUMES }, () => 'resume'), 'stop']);
  });

  test('whatever the order of the failures, it stops after at most the reloads plus the resumes', () => {
    const mixed: LoadFailure[] = Array.from({ length: 20 }, (_, index) => (index % 2 === 0 ? 'manifest' : 'stream'));
    const taken = actions(mixed);

    expect(taken.at(-1)).toBe('stop');
    expect(taken.length - 1).toBeLessThanOrEqual(HLS_MANIFEST_RELOADS + HLS_STREAM_RESUMES);
  });

  test('a stop leaves the attempts as they were', () => {
    const spent: NetworkAttempts = { manifest: HLS_MANIFEST_RELOADS, stream: 0 };

    expect(stepNetworkRecovery(spent, 'manifest')).toEqual({ recovery: { action: 'stop' }, attempts: spent });
  });
});

describe('getBufferedAhead: how far the media is buffered ahead of a position', () => {
  /**
   * Buffered ranges as the media element reports them
   */
  function ranges(...list: [number, number][]): Pick<TimeRanges, 'length' | 'start' | 'end'> {
    return { length: list.length, start: index => list[index]![0], end: index => list[index]![1] };
  }

  const cases: [string, ReturnType<typeof ranges>, number, number][] = [
    ['nothing buffered', ranges(), 10, 0],
    ['to the end of the range that holds the position', ranges([0, 30]), 10, 20],
    ['other ranges do not count', ranges([0, 5], [8, 30], [40, 60]), 10, 20],
    ['a position in a hole has nothing ahead', ranges([0, 5], [20, 30]), 10, 0],
    [
      `a range that starts up to ${BUFFER_POSITION_TOLERANCE_S} s after the position counts (the playhead can sit just before it)`,
      ranges([10 + BUFFER_POSITION_TOLERANCE_S, 30]), 10, 20
    ],
    ['a range that starts later does not', ranges([10 + (2 * BUFFER_POSITION_TOLERANCE_S), 30]), 10, 0],
    ['at the very end of a range nothing is ahead', ranges([0, 10]), 10, 0]
  ];

  test.each(cases)('%s', (_, buffered, position, expected) => {
    expect(getBufferedAhead(buffered, position)).toBeCloseTo(expected, 6);
  });
});
