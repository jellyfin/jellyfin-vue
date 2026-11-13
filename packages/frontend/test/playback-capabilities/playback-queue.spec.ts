import { describe, expect, test } from 'vitest';
import { findQueueItem, getMovedQueue, getPlayedSelection, getPlayNextQueue, getQueuedSelection, getShuffledAddition, getShuffledQueue, getShuffleRemoval, getUnshuffledIndex, getUnshuffledQueue, getQueueRemoval, getUnplayableItemStep, goesToPreviousItem, isUnplayableItem } from '#/utils/playback-queue.ts';

const items = (...ids: string[]) => ids.map(Id => ({ Id }));

describe('findQueueItem', () => {
  test('the item at its index', () => {
    expect(findQueueItem(items('a', 'b', 'c'), 'b', 1)).toEqual({ Id: 'b' });
  });

  test('the items of the queue before a reorder still hold the current item, at another index', () => {
    // Shuffled to ['c', 'a', 'b'] with 'c' first: the fetched items are still in the old order
    expect(findQueueItem(items('a', 'b', 'c'), 'c', 0)).toEqual({ Id: 'c' });
  });

  test('the items of the queue before a removal still hold the current item, at another index', () => {
    // 'a' removed from ['a', 'b', 'c'] while 'b' plays: the index moves from 1 to 0
    expect(findQueueItem(items('a', 'b', 'c'), 'b', 0)).toEqual({ Id: 'b' });
  });

  test('never another item: undefined while the items of a new queue are not fetched', () => {
    expect(findQueueItem(items('a', 'b'), 'x', 0)).toBeUndefined();
  });

  test('undefined without an id', () => {
    expect(findQueueItem(items('a'), undefined, 0)).toBeUndefined();
    expect(findQueueItem(items('a'), 'a', undefined)).toEqual({ Id: 'a' });
  });
});

describe('getQueueRemoval', () => {
  test('an item before the current one: the current item keeps playing, one position earlier', () => {
    expect(getQueueRemoval(['a', 'b', 'c'], 1, 'a', false)).toEqual({ queue: ['b', 'c'], index: 0, currentRemoved: false });
  });

  test('an item after the current one: nothing moves', () => {
    expect(getQueueRemoval(['a', 'b', 'c'], 1, 'c', false)).toEqual({ queue: ['a', 'b'], index: 1, currentRemoved: false });
  });

  test('the current item: the item that followed it takes its place', () => {
    expect(getQueueRemoval(['a', 'b', 'c'], 1, 'b', false)).toEqual({ queue: ['a', 'c'], index: 1, currentRemoved: true });
  });

  test('the current item when it is the last one: the queue ends, or starts again when repeating all', () => {
    expect(getQueueRemoval(['a', 'b', 'c'], 2, 'c', false)).toEqual({ queue: ['a', 'b'], index: undefined, currentRemoved: true });
    expect(getQueueRemoval(['a', 'b', 'c'], 2, 'c', true)).toEqual({ queue: ['a', 'b'], index: 0, currentRemoved: true });
  });

  test('the last item, not the current one', () => {
    expect(getQueueRemoval(['a', 'b', 'c'], 0, 'c', false)).toEqual({ queue: ['a', 'b'], index: 0, currentRemoved: false });
  });

  test('the only item: nothing is left to play', () => {
    expect(getQueueRemoval(['a'], 0, 'a', true)).toEqual({ queue: [], index: undefined, currentRemoved: true });
  });

  test('an item that is not in the queue changes nothing', () => {
    expect(getQueueRemoval(['a', 'b'], 0, 'x', false)).toBeUndefined();
  });

  test('an item queued twice: its first occurrence is removed', () => {
    expect(getQueueRemoval(['a', 'b', 'a'], 2, 'a', false)).toEqual({ queue: ['b', 'a'], index: 1, currentRemoved: false });
  });

  test('without a current item, there is still none', () => {
    expect(getQueueRemoval(['a', 'b'], undefined, 'a', false)).toEqual({ queue: ['b'], index: undefined, currentRemoved: false });
  });

  test('the queue passed in is not mutated', () => {
    const queue = ['a', 'b'];

    getQueueRemoval(queue, 1, 'a', false);
    expect(queue).toEqual(['a', 'b']);
  });
});

describe('getPlayNextQueue', () => {
  test('the items go right after the current one', () => {
    expect(getPlayNextQueue(['a', 'b', 'c', 'd'], 1, ['x', 'y'])).toEqual({ queue: ['a', 'b', 'x', 'y', 'c', 'd'], index: 1 });
  });

  test('an item queued before the current one moves right after it', () => {
    // 'a' before the current 'c': the current item is one position earlier once 'a' leaves
    expect(getPlayNextQueue(['a', 'b', 'c', 'd', 'e'], 2, ['a'])).toEqual({ queue: ['b', 'c', 'a', 'd', 'e'], index: 1 });
  });

  test('an item queued after the current one moves right after it', () => {
    expect(getPlayNextQueue(['a', 'b', 'c', 'd'], 0, ['d'])).toEqual({ queue: ['a', 'd', 'b', 'c'], index: 0 });
  });

  test('the current item stays where it is, also when it is among the items', () => {
    expect(getPlayNextQueue(['a', 'b', 'c'], 1, ['b', 'x'])).toEqual({ queue: ['a', 'b', 'x', 'c'], index: 1 });
  });

  test('a current item that is also earlier in the queue (a playlist with it twice) keeps its own position', () => {
    // The second 'a' plays: next must be 'x', not 'b'
    expect(getPlayNextQueue(['a', 'b', 'a', 'c'], 2, ['x'])).toEqual({ queue: ['a', 'b', 'a', 'x', 'c'], index: 2 });
  });

  test('without a current item, nothing changes', () => {
    expect(getPlayNextQueue(['a', 'b'], undefined, ['x'])).toBeUndefined();
  });
});

describe('getMovedQueue', () => {
  test('moving another item before the current one moves the current one a position later', () => {
    expect(getMovedQueue(['a', 'b', 'c', 'd'], 2, 3, 0)).toEqual({ queue: ['d', 'a', 'b', 'c'], index: 3 });
  });

  test('moving another item from before the current one to after it moves the current one a position earlier', () => {
    expect(getMovedQueue(['a', 'b', 'c', 'd'], 2, 0, 3)).toEqual({ queue: ['b', 'c', 'd', 'a'], index: 1 });
  });

  test('moving the current item: it plays on at its new position', () => {
    expect(getMovedQueue(['a', 'b', 'c'], 0, 0, 2)).toEqual({ queue: ['b', 'c', 'a'], index: 2 });
  });

  test('an item queued twice: only the entry moved moves, and the copy that plays stays the current one', () => {
    expect(getMovedQueue(['a', 'b', 'a', 'c'], 2, 1, 3)).toEqual({ queue: ['a', 'a', 'c', 'b'], index: 1 });
    expect(getMovedQueue(['a', 'b', 'a', 'c'], 2, 0, 3)).toEqual({ queue: ['b', 'a', 'c', 'a'], index: 1 });
  });

  test('positions out of the queue change nothing', () => {
    expect(getMovedQueue(['a', 'b'], 0, 5, 0)).toBeUndefined();
  });

  test('without a current item there is still none', () => {
    expect(getMovedQueue(['a', 'b'], undefined, 0, 1)).toEqual({ queue: ['b', 'a'], index: undefined });
  });
});

describe('isUnplayableItem', () => {
  const source = { Id: 's1' };

  test('video and audio with a version at the index are playable', () => {
    expect(isUnplayableItem({ MediaType: 'Video', MediaSources: [source] }, 0)).toBe(false);
    expect(isUnplayableItem({ MediaType: 'Audio', MediaSources: [source] }, 0)).toBe(false);
  });

  test('while the version is not decided yet, nothing is known', () => {
    expect(isUnplayableItem({ MediaType: 'Video', MediaSources: [] }, undefined)).toBe(false);
  });

  test('media the player does not play (photos, books, unknown) never plays', () => {
    expect(isUnplayableItem({ MediaType: 'Photo', MediaSources: [source] }, 0)).toBe(true);
    expect(isUnplayableItem({ MediaType: 'Book' }, undefined)).toBe(true);
    expect(isUnplayableItem({ MediaType: 'Unknown' }, undefined)).toBe(true);
  });

  test('no version at the index: no versions, a chosen version that does not exist, or one without an id', () => {
    expect(isUnplayableItem({ MediaType: 'Video', MediaSources: [] }, 0)).toBe(true);
    expect(isUnplayableItem({ MediaType: 'Video' }, 0)).toBe(true);
    expect(isUnplayableItem({ MediaType: 'Video', MediaSources: [source] }, 3)).toBe(true);
    expect(isUnplayableItem({ MediaType: 'Video', MediaSources: [source] }, -1)).toBe(true);
    expect(isUnplayableItem({ MediaType: 'Video', MediaSources: [{}] }, 0)).toBe(true);
  });
});

describe('getUnplayableItemStep', () => {
  test('the queue moves on to the next item', () => {
    expect(getUnplayableItemStep({ hasNext: true, skippedInARow: 1, queueLength: 3 })).toBe('next');
  });

  test('without a next item, the playback stops', () => {
    expect(getUnplayableItemStep({ hasNext: false, skippedInARow: 1, queueLength: 3 })).toBe('stop');
  });

  test('a queue that repeats where nothing plays stops once every item was skipped in a row', () => {
    expect(getUnplayableItemStep({ hasNext: true, skippedInARow: 2, queueLength: 3 })).toBe('next');
    expect(getUnplayableItemStep({ hasNext: true, skippedInARow: 3, queueLength: 3 })).toBe('stop');
    expect(getUnplayableItemStep({ hasNext: true, skippedInARow: 1, queueLength: 1 })).toBe('stop');
  });
});

describe('goesToPreviousItem', () => {
  test('an item before the current one, when going back', () => {
    expect(goesToPreviousItem(1, 3, true)).toBe(true);
  });

  test('the first item has none before it: it starts again', () => {
    // The index before the first item, without repeating all
    expect(goesToPreviousItem(-1, 3, true)).toBe(false);
  });

  test('repeating all, the first item goes to the last one', () => {
    expect(goesToPreviousItem(2, 3, true)).toBe(true);
  });

  test('not when the current item played long enough to start again', () => {
    expect(goesToPreviousItem(1, 3, false)).toBe(false);
  });

  test('nothing current, or an index out of the queue: it starts again', () => {
    expect(goesToPreviousItem(undefined, 3, true)).toBe(false);
    expect(goesToPreviousItem(3, 3, true)).toBe(false);
  });
});

describe('getQueuedSelection', () => {
  const item = { Id: 'm', MediaSources: [{ Id: 'v1080' }, { Id: 'v720' }, { Id: 'v480' }] };

  test('the version chosen for the item, by its id, with the tracks chosen with it', () => {
    expect(getQueuedSelection(item, { mediaSourceIndex: 2, audioTrackIndex: 3, subtitleTrackIndex: -1 }))
      .toEqual({ source: 2, sourceId: 'v480', video: undefined, audio: 3, subtitle: -1 });
  });

  test('nothing without a chosen version: the tracks belong to a version', () => {
    expect(getQueuedSelection(item, { audioTrackIndex: 3 })).toBeUndefined();
    expect(getQueuedSelection(item, undefined)).toBeUndefined();
  });

  test('nothing for a folder: the choice refers to its own streams, not to the children that are queued', () => {
    expect(getQueuedSelection({ ...item, IsFolder: true }, { mediaSourceIndex: 1 })).toBeUndefined();
  });

  test('a version the item does not have keeps no id, so it is not played as another one', () => {
    expect(getQueuedSelection(item, { mediaSourceIndex: 7 })).toEqual({ source: 7, sourceId: undefined, video: undefined, audio: undefined, subtitle: undefined });
  });
});

describe('getPlayedSelection', () => {
  test('what the user picked in the player, with the version that plays, replaces what was stored for the item', () => {
    expect(getPlayedSelection({ audio: 5, subtitle: -1 }, { index: 1, id: 'v720' })).toEqual({ source: 1, sourceId: 'v720', video: undefined, audio: 5, subtitle: -1 });
  });

  test('nothing while the version played is not known (being decided, or gone)', () => {
    expect(getPlayedSelection({ audio: 5 }, { index: undefined, id: undefined })).toBeUndefined();
    expect(getPlayedSelection({ audio: 5 }, { index: -1, id: undefined })).toBeUndefined();
  });
});

describe('getShuffledQueue and getUnshuffledIndex', () => {
  test('the entries in the order given, the current one first, and where each came from', () => {
    // current: the second 'a' (position 2); the shuffle gave positions 3, 2, 0, 1
    expect(getShuffledQueue(['a', 'b', 'a', 'c'], 2, [3, 2, 0, 1], true)).toEqual({ queue: ['a', 'c', 'a', 'b'], index: 0, origins: [2, 3, 0, 1] });
  });

  test('without keeping the current entry first, the first of the shuffled queue plays', () => {
    expect(getShuffledQueue(['a', 'b', 'c'], 0, [2, 0, 1], false)).toEqual({ queue: ['c', 'a', 'b'], index: 0, origins: [2, 0, 1] });
  });

  test('turning shuffle off goes back to the position the current entry came from, also when its item is queued twice', () => {
    // Playing the shuffled entry 2, which is the 'a' that was at position 2 (not the first 'a')
    expect(getUnshuffledIndex(['a', 'b', 'a', 'c'], [3, 1, 2, 0], 2, 'a')).toBe(2);
  });

  test('when the positions are not known (the queue changed while shuffled), the first copy of the item', () => {
    expect(getUnshuffledIndex(['a', 'b', 'a', 'c'], [], 2, 'a')).toBe(0);
    // A position that no longer holds the current item
    expect(getUnshuffledIndex(['a', 'b', 'a', 'c'], [1, 0], 0, 'a')).toBe(0);
  });
});

describe('getShuffleRemoval', () => {
  test('removing a shuffled entry removes the copy it came from in the order before shuffling', () => {
    /*
     * Shuffled ['a', 'c', 'a', 'b'] came from positions [2, 3, 0, 1] of ['a', 'b', 'a', 'c']: removing the first shuffled
     * 'a' removes the 'a' at position 2, and the positions after it move one back
     */
    expect(getShuffleRemoval(['a', 'b', 'a', 'c'], [2, 3, 0, 1], 0, 'a')).toEqual({ originalQueue: ['a', 'b', 'c'], origins: [2, 0, 1] });
  });

  test('without known positions, the first copy goes and the positions stay unknown', () => {
    expect(getShuffleRemoval(['a', 'b', 'a'], [], 0, 'a')).toEqual({ originalQueue: ['b', 'a'], origins: [] });
  });

  test('an item that is not in the order before shuffling changes nothing there', () => {
    expect(getShuffleRemoval(['a', 'b'], [0, 1], 0, 'x')).toEqual({ originalQueue: ['a', 'b'], origins: [] });
  });
});

describe('getShuffledAddition', () => {
  test('"add to queue" while shuffled: at the end of the order before shuffling too', () => {
    // Shuffled ['B', 'D', 'A', 'C'] came from positions [1, 3, 0, 2] of ['A', 'B', 'C', 'D']
    expect(getShuffledAddition(['A', 'B', 'C', 'D'], [1, 3, 0, 2], 0, 'B', ['X'], 'end')).toEqual({ originalQueue: ['A', 'B', 'C', 'D', 'X'], shuffleOrigins: [1, 3, 0, 2, 4] });
  });

  test('"add to queue" with unknown positions: still at the end, the positions stay unknown', () => {
    expect(getShuffledAddition(['A', 'B'], [], 0, 'B', ['X', 'Y'], 'end')).toEqual({ originalQueue: ['A', 'B', 'X', 'Y'], shuffleOrigins: [] });
  });

  test('"play next" while shuffled: right after the entry that plays, in the order before shuffling too', () => {
    expect(getShuffledAddition(['A', 'B', 'C', 'D'], [1, 3, 0, 2], 0, 'B', ['X'], 'next')).toEqual({ originalQueue: ['A', 'B', 'X', 'C', 'D'], shuffleOrigins: [] });
  });

  test('"play next" follows the copy that plays when its item is queued twice', () => {
    // Playing shuffled entry 1, which came from position 2 (the second 'A')
    expect(getShuffledAddition(['A', 'B', 'A'], [1, 2, 0], 1, 'A', ['X'], 'next')).toEqual({ originalQueue: ['A', 'B', 'A', 'X'], shuffleOrigins: [] });
  });

  test('"play next" of items already queued only moves them in the shuffled order: the order before stays', () => {
    expect(getShuffledAddition(['A', 'B', 'C'], [1, 2, 0], 0, 'B', ['C', 'X'], 'next')).toEqual({ originalQueue: ['A', 'B', 'X', 'C'], shuffleOrigins: [] });
  });

  test('"play next" when the entry that plays is not in the order before shuffling: at the end', () => {
    expect(getShuffledAddition(['A', 'B'], [], 0, 'Z', ['X'], 'next')).toEqual({ originalQueue: ['A', 'B', 'X'], shuffleOrigins: [] });
  });
});

describe('getUnshuffledQueue', () => {
  test('the order before shuffling, at the position the current entry came from', () => {
    expect(getUnshuffledQueue(['A', 'B', 'A', 'C'], [3, 1, 2, 0], 2, 'A')).toEqual({ queue: ['A', 'B', 'A', 'C'], index: 2 });
  });

  test('the current item is never lost: one missing from the order before shuffling stays, at its end', () => {
    expect(getUnshuffledQueue(['A', 'B'], [], 1, 'X')).toEqual({ queue: ['A', 'B', 'X'], index: 2 });
  });

  test('the sequence of the review: "play next" X while shuffled, X plays, shuffle off', () => {
    const original = ['A', 'B', 'C', 'D'];
    const shuffled = getShuffledQueue(original, 1, [3, 0, 1, 2], true);
    const next = getPlayNextQueue(shuffled.queue, shuffled.index, ['X']);
    const addition = getShuffledAddition(original, shuffled.origins, shuffled.index, 'B', ['X'], 'next');

    expect(next?.queue).toEqual(['B', 'X', 'D', 'A', 'C']);
    // X plays (index 1 of the shuffled queue); turning shuffle off goes back to the order before, with X after B
    expect(getUnshuffledQueue(addition.originalQueue, addition.shuffleOrigins, 1, 'X')).toEqual({ queue: ['A', 'B', 'X', 'C', 'D'], index: 2 });
  });
});
