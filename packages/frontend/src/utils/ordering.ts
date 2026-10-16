/**
 * Orders items by their saved ids and appends items missing from that order.
 */
export function orderItemsById<T extends { Id?: string }>(items: readonly T[], order: readonly string[]): T[] {
  const itemsById = new Map(items.flatMap(item => item.Id ? [[item.Id, item] as const] : []));
  const orderedItems: T[] = [];
  const addedIds = new Set<string>();

  for (const id of order) {
    const item = itemsById.get(id);

    if (item && !addedIds.has(id)) {
      orderedItems.push(item);
      addedIds.add(id);
    }
  }

  for (const item of items) {
    if (!item.Id || !addedIds.has(item.Id)) {
      orderedItems.push(item);
    }
  }

  return orderedItems;
}
