import { describe, expect, test } from 'vitest';
import type { Dialogue } from '#/plugins/workers/generic/subtitles.ts';
import { findCueIndex } from '#/utils/subtitle-cues.ts';

/**
 * One cue every 4 s, 2 s long: [0, 2], [4, 6], [8, 10]...
 */
const CUES: Dialogue[] = Array.from({ length: 100 }, (_, index) => ({ start: index * 4, end: (index * 4) + 2, text: `cue ${index}` }));

/**
 * Looks the cues up at each time in turn, each lookup given what the previous one returned, like the overlay does
 *
 * @returns The text shown at each time (undefined: nothing)
 */
function play(cues: readonly Dialogue[], times: readonly number[]): (string | undefined)[] {
  let previous: number | undefined;

  return times.map((time) => {
    const index = findCueIndex(cues, time, previous);

    previous = index ?? previous;

    return index === undefined ? undefined : cues[index]?.text;
  });
}

/**
 * Every quarter of a second from `from` to `to`
 */
function quarters(from: number, to: number): number[] {
  return Array.from({ length: ((to - from) * 4) + 1 }, (_, index) => from + (index / 4));
}

describe('findCueIndex: the cue the subtitle overlay shows at a media time', () => {
  test('playing forward shows each cue while it covers the time, and nothing between cues', () => {
    const shown = play(CUES, [0, 1, 2, 3, 4, 5.5, 7, 8]);

    expect(shown).toEqual(['cue 0', 'cue 0', 'cue 0', undefined, 'cue 1', 'cue 1', undefined, 'cue 2']);
  });

  test('a seek back (skip back 15 s) shows the cue at the new time at once', () => {
    const shown = play(CUES, [...quarters(0, 201), 185, 189, 193]);

    expect(shown.slice(-4)).toEqual(['cue 50', 'cue 46', 'cue 47', 'cue 48']);
  });

  test('a seek forward past several cues shows the cue at the new time at once', () => {
    const shown = play(CUES, [...quarters(0, 5), 300.5, 304.5]);

    expect(shown.slice(-2)).toEqual(['cue 75', 'cue 76']);
  });

  test('a seek into a gap shows nothing, and the next cue shows when the time reaches it', () => {
    const shown = play(CUES, [...quarters(0, 201), 186.5, 188.5]);

    expect(shown.slice(-2)).toEqual([undefined, 'cue 47']);
  });

  test('a previous index from another track (or out of the list) still finds the cue by time', () => {
    const other: Dialogue[] = [{ start: 0, end: 1000, text: 'one long cue' }];

    expect([findCueIndex(other, 500, 75), findCueIndex(CUES, 9, 500)]).toEqual([0, 2]);
  });

  test('with overlapping cues the one shown keeps showing while it covers the time; without one, the first in the file', () => {
    const overlapping: Dialogue[] = [
      { start: 0, end: 10, text: 'sign' },
      { start: 2, end: 4, text: 'line' }
    ];

    expect([findCueIndex(overlapping, 3, 1), findCueIndex(overlapping, 3)]).toEqual([1, 0]);
  });

  test('no cues, nothing to show', () => {
    expect(findCueIndex([], 3, 0)).toBeUndefined();
  });
});
