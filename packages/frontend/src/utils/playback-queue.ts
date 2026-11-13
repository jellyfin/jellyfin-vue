/**
 * Rules of the playback queue that don't depend on the store: which fetched item is the current one, and where items
 * go when they are removed or played next.
 *
 * The queue is a list of item ids. The items themselves are fetched asynchronously, so right after the ids change the
 * fetched items may still be those of the previous list: anything that reads them must find them by id.
 */
import { isNil } from '@jellyfin-vue/shared/validation';

/**
 * The fetched item with an id. It's looked for at its index first and then anywhere: a reorder of the queue (shuffle,
 * moving an item, "play next", a removal) changes the index of the current item at once, while the fetched items are
 * still in the previous order for a moment. It never returns an item with another id, so while the items of a new
 * queue are being fetched it's undefined.
 *
 * @param items - The fetched items of the queue, in whatever order they were fetched last
 * @param id - What to look for: the id the queue holds at that index
 * @param index - Its index in the queue of ids, if known
 */
export function findQueueItem<T extends { readonly Id?: string | null }>(
  items: readonly T[],
  id: string | undefined,
  index: number | undefined
): T | undefined {
  if (isNil(id)) {
    return;
  }

  const atIndex = isNil(index) ? undefined : items[index];

  return atIndex?.Id === id ? atIndex : items.find(item => item.Id === id);
}

/**
 * The queue without an item, and the index of the current item in it
 */
export interface QueueRemoval {
  readonly queue: string[];
  /**
   * The index the current item is at after the removal. When the current item was removed, the item that followed it
   * takes its place (the first one when repeating all and it was the last); undefined when nothing is left to play.
   */
  readonly index: number | undefined;
  readonly currentRemoved: boolean;
}

/**
 * Removes the first occurrence of an item from the queue. The current item goes on playing at its new index; if it's
 * the one removed, the item that followed it is the current one.
 *
 * @param queue - The queue of item ids (not mutated)
 * @param index - The index of the current item, if any
 * @param itemId - The item to remove
 * @param repeatAll - Whether the queue starts again after its last item
 * @returns Undefined when the item isn't queued
 */
export function getQueueRemoval(
  queue: readonly string[],
  index: number | undefined,
  itemId: string,
  repeatAll: boolean
): QueueRemoval | undefined {
  const removed = queue.indexOf(itemId);

  if (removed === -1) {
    return;
  }

  const rest = queue.toSpliced(removed, 1);

  if (isNil(index) || removed > index) {
    return { queue: rest, index, currentRemoved: false };
  }

  if (removed < index) {
    return { queue: rest, index: index - 1, currentRemoved: false };
  }

  if (index < rest.length) {
    return { queue: rest, index, currentRemoved: true };
  }

  return { queue: rest, index: repeatAll && rest.length > 0 ? 0 : undefined, currentRemoved: true };
}

/**
 * The queue after "play next": the items go right after the current item, which stays where it is. Items that were
 * queued already are moved there, not repeated.
 *
 * @param queue - The queue of item ids (not mutated)
 * @param index - The index of the current item, if any
 * @param items - The ids to play next, in order
 * @returns Undefined without a current item
 */
export function getPlayNextQueue(queue: readonly string[], index: number | undefined, items: readonly string[]): string[] | undefined {
  const current = isNil(index) ? undefined : queue[index];

  if (isNil(current) || isNil(index)) {
    return;
  }

  const moved = items.filter(id => id !== current);
  const isMoved = (id: string) => moved.includes(id);
  const before = queue.slice(0, index).filter(id => !isMoved(id));
  const after = queue.slice(index + 1).filter(id => !isMoved(id));

  return [...before, current, ...moved, ...after];
}
