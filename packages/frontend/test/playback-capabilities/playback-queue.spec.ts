import { describe, expect, test } from 'vitest';
import { findQueueItem, getPlayNextQueue, getQueueRemoval, getUnplayableItemStep, isUnplayableItem } from '#/utils/playback-queue.ts';

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
    expect(getPlayNextQueue(['a', 'b', 'c', 'd'], 1, ['x', 'y'])).toEqual(['a', 'b', 'x', 'y', 'c', 'd']);
  });

  test('an item queued before the current one moves right after it', () => {
    // 'a' before the current 'c': the current item is one position earlier once 'a' leaves
    expect(getPlayNextQueue(['a', 'b', 'c', 'd', 'e'], 2, ['a'])).toEqual(['b', 'c', 'a', 'd', 'e']);
  });

  test('an item queued after the current one moves right after it', () => {
    expect(getPlayNextQueue(['a', 'b', 'c', 'd'], 0, ['d'])).toEqual(['a', 'd', 'b', 'c']);
  });

  test('the current item stays where it is, also when it is among the items', () => {
    expect(getPlayNextQueue(['a', 'b', 'c'], 1, ['b', 'x'])).toEqual(['a', 'b', 'x', 'c']);
  });

  test('without a current item, nothing changes', () => {
    expect(getPlayNextQueue(['a', 'b'], undefined, ['x'])).toBeUndefined();
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
