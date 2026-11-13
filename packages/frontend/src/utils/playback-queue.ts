/**
 * Rules of the playback queue that don't depend on the store: which fetched item is the current one, where items
 * go when they are removed or played next, what "previous" does, what happens with an item that can't be played, and
 * which version a queued item keeps.
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

/**
 * Whether an item can't be negotiated at all, once that's known: it isn't media the player plays (photos and books
 * end up in a queue made from a folder), or it has no version at the index it's played with (no `MediaSources`, or a
 * chosen version that doesn't exist). While its version is not decided yet, nothing is known.
 *
 * @param item - The current item
 * @param index - The index in `MediaSources` of the version it's played with, if decided (-1: none)
 */
export function isUnplayableItem(
  item: { readonly MediaType?: string | null; readonly MediaSources?: readonly { readonly Id?: string | null }[] | null },
  index: number | undefined
): boolean {
  if (item.MediaType !== 'Video' && item.MediaType !== 'Audio') {
    return true;
  }

  return !isNil(index) && isNil(item.MediaSources?.[index]?.Id);
}

/**
 * What the queue does when its current item can't be played at all: it moves on to the next item, or stops when there
 * is none or when every item of the queue was skipped in a row (a queue that repeats where nothing plays)
 *
 * @param state - Whether the queue has an item after the current one, how many items were skipped in a row counting
 * the current one, and how many items the queue has
 */
export function getUnplayableItemStep(
  { hasNext, skippedInARow, queueLength }: { readonly hasNext: boolean; readonly skippedInARow: number; readonly queueLength: number }
): 'next' | 'stop' {
  return hasNext && skippedInARow < queueLength ? 'next' : 'stop';
}

/**
 * Whether "previous" moves to another item: the user goes back (see `setPreviousItem`) and the queue has an item at
 * the previous index (before the current one, or the last one when repeating all). Otherwise the current item starts
 * again.
 *
 * @param previousIndex - The index before the current item's, as the queue counts it
 * @param queueLength - How many items the queue has
 * @param goBack - Whether the user goes back to the previous item rather than to the start of the current one
 */
export function goesToPreviousItem(previousIndex: number | undefined, queueLength: number, goBack: boolean): boolean {
  return goBack && !isNil(previousIndex) && previousIndex >= 0 && previousIndex < queueLength;
}

/**
 * A version and tracks chosen by the user for one item. The version is kept by its id (`sourceId`; `source` is the
 * index it was chosen with); tracks are absolute `MediaStream.Index` values, `-1` for "no subtitles".
 */
export interface ItemSelection {
  readonly source?: number;
  readonly sourceId?: string;
  readonly video?: number;
  readonly audio?: number;
  readonly subtitle?: number;
}

/**
 * What a queued item keeps for when it becomes the current one: the version (and the tracks chosen with it) picked
 * for that very item, since an explicit version is valid for the item it was chosen for. Nothing for a folder, whose
 * children are queued (the choice refers to the folder's own streams), and nothing without a chosen version (the
 * tracks belong to a version).
 *
 * @param item - The item queued, as the choice was made on it
 * @param choice - The version, as an index in the item's `MediaSources`, and tracks
 */
export function getQueuedSelection(
  item: { readonly Id?: string | null; readonly IsFolder?: boolean | null; readonly MediaSources?: readonly { readonly Id?: string | null }[] | null },
  choice: { readonly mediaSourceIndex?: number; readonly videoTrackIndex?: number; readonly audioTrackIndex?: number; readonly subtitleTrackIndex?: number } | undefined
): ItemSelection | undefined {
  const index = choice?.mediaSourceIndex;

  if (item.IsFolder || !item.Id || isNil(index)) {
    return;
  }

  return {
    source: index,
    sourceId: item.MediaSources?.[index]?.Id ?? undefined,
    video: choice?.videoTrackIndex,
    audio: choice?.audioTrackIndex,
    subtitle: choice?.subtitleTrackIndex
  };
}

/**
 * What an item keeps once the user picked a track for it in the player: its tracks as they are now and the version it
 * plays. It replaces what was stored for the item (see `getQueuedSelection`), so the queue coming back to the item plays
 * what the user last picked, not what its page had.
 *
 * @param selection - The item's tracks after the pick
 * @param version - The version it plays: its index in `MediaSources` and its id
 * @returns Undefined while the version played is not known
 */
export function getPlayedSelection(
  selection: { readonly video?: number; readonly audio?: number; readonly subtitle?: number },
  version: { readonly index?: number; readonly id?: string | null }
): ItemSelection | undefined {
  if (isNil(version.index) || version.index < 0 || isNil(version.id)) {
    return;
  }

  return { source: version.index, sourceId: version.id, video: selection.video, audio: selection.audio, subtitle: selection.subtitle };
}
