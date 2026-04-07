import Dexie from 'dexie';
import type { ArrayTail } from 'type-fest';
import type { BaseDbEntity } from './base-entity';

const staleTime = 604_800_000; /* 1 week in milliseconds */

/**
 * Delete items that are older than the stale time
 */
async function deleteStale(db: Dexie, table: string): Promise<void> {
  const count = await db.table(table)
    .where('__timestamp')
    .belowOrEqual(Date.now() - staleTime)
    .delete();

  console.log(`[Jellyfin] Cleared ${count} items from ${db.name}.${table}`);
}

export abstract class BaseDb extends Dexie {
  protected readonly _createWriteTransaction
    = (...args: ArrayTail<Parameters<typeof this.transaction>>) =>
      this.transaction('rw!', ...args);

  public readonly deleteStaleRecords = () =>
    // @ts-expect-error - TODO: Fix this upstream at type-fest
    this._createWriteTransaction(this.tables, async () => {
      for (const table of this.tables) {
        await deleteStale(this, table.name);
      }
    });

  public readonly clearAll = async () =>
    // @ts-expect-error - TODO: Fix this upstream at type-fest
    this._createWriteTransaction(this.tables, async () => {
      for (const table of this.tables) {
        await this.table(table.name).clear();
      }
    });

  public constructor(name: string, entities: Map<typeof BaseDbEntity, string>, version = 1) {
    super(name, { cache: 'disabled', allowEmptyDB: true });

    const stores: Record<string, string> = {};

    for (const [entityClass, keys] of entities) {
      stores[entityClass.tableName] = `${keys},__timestamp`;
    }

    this.version(version).stores(stores);

    for (const [EntityClass] of entities) {
      const tableName = EntityClass.tableName;
      const table = this.table(tableName);

      table.hook('reading', (obj) => {
        const instance = new EntityClass(this);

        return Object.assign(instance, obj);
      });
      table.hook('updating', (_, __, obj: BaseDbEntity<never>) => {
        obj.__timestamp = Date.now();
      });
    }

    globalThis.setTimeout(() => {
      void this.deleteStaleRecords();
    }, 30_000);
  }
}
