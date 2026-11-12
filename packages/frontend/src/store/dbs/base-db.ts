import Dexie, { type IndexableType } from 'dexie';
import type { ArrayTail } from 'type-fest';
import type { BaseDbEntity } from './base-entity.ts';

const staleTime = 604_800_000; /* 1 week in milliseconds */

/**
 * Declares that the rows of a table belong to the rows of another table: they are deleted together with their
 * owner, in the same transaction, and never purged on their own clock (they have no expiry of their own).
 */
export interface DependentTable {
  /**
   * The table whose rows belong to the owner's rows
   */
  readonly table: string;
  /**
   * The owner table
   */
  readonly owner: string;
  /**
   * Field of the dependent rows holding the primary key of their owner. It must be indexed or be the
   * primary key of the dependent table.
   */
  readonly ownerKey: string;
}

export abstract class BaseDb extends Dexie {
  private readonly _dependents: readonly DependentTable[];
  /**
   * Deletes the dependent rows whose owner does not exist (for example, written for an owner that was deleted
   * by an older version of the app). Must run inside a write transaction that includes all the tables involved.
   */
  private readonly _deleteOrphans = async (): Promise<void> => {
    for (const dependent of this._dependents) {
      const referenced = await this.table(dependent.table).orderBy(dependent.ownerKey).uniqueKeys();
      const existing = new Set(await this.table(dependent.owner).where(':id').anyOf(referenced).primaryKeys());
      const missing = referenced.filter(key => !existing.has(key));

      if (missing.length > 0) {
        const orphans = await this.table(dependent.table).where(dependent.ownerKey).anyOf(missing).primaryKeys();

        await this._deleteWithDependents(dependent.table, orphans);
      }
    }
  };

  protected readonly _createWriteTransaction
    = (...args: ArrayTail<Parameters<typeof this.transaction>>) =>
      this.transaction('rw!', ...args);

  /**
   * Deletes rows by primary key, together with their dependent rows (recursively).
   * Must run inside a write transaction that includes the dependent tables.
   */
  protected readonly _deleteWithDependents = async (table: string, keys: IndexableType[]): Promise<void> => {
    if (keys.length === 0) {
      return;
    }

    await this.table(table).bulkDelete(keys);

    for (const dependent of this._dependents) {
      if (dependent.owner !== table) {
        continue;
      }

      const dependentKeys = await this.table(dependent.table).where(dependent.ownerKey).anyOf(keys).primaryKeys();

      await this._deleteWithDependents(dependent.table, dependentKeys);
    }
  };

  /**
   * Deletes the rows older than the stale time, with their dependent rows. Dependent tables are not purged by
   * their own write time: their rows live exactly as long as their owners.
   */
  public readonly deleteStaleRecords = () =>
    // @ts-expect-error - TODO: Fix this upstream at type-fest
    this._createWriteTransaction(this.tables, async () => {
      const dependentTables = new Set(this._dependents.map(relation => relation.table));

      for (const table of this.tables) {
        if (dependentTables.has(table.name)) {
          continue;
        }

        const keys = await table
          .where('__timestamp')
          .belowOrEqual(Date.now() - staleTime)
          .primaryKeys();

        await this._deleteWithDependents(table.name, keys);
        console.log(`[Jellyfin] Cleared ${keys.length} items from ${this.name}.${table.name}`);
      }

      await this._deleteOrphans();
    });

  public readonly clearAll = async () =>
    // @ts-expect-error - TODO: Fix this upstream at type-fest
    this._createWriteTransaction(this.tables, async () => {
      for (const table of this.tables) {
        await this.table(table.name).clear();
      }
    });

  /**
   * Declares the schema, the dependent tables and schedules the eviction of stale records
   *
   * @param name - Name of the database
   * @param entities - Entity classes of each table, with the table's primary key and indexes
   * (see Dexie's `version().stores()`). The `__timestamp` index is added to all of them.
   * @param version - Schema version. Bump it whenever the schema changes: Dexie upgrades older databases
   * by itself when tables or indexes are only added.
   * @param dependents - Tables whose rows are deleted together with the rows of another table
   */
  public constructor(
    name: string,
    entities: Map<typeof BaseDbEntity, string>,
    version = 1,
    dependents: readonly DependentTable[] = []
  ) {
    super(name, { cache: 'disabled', allowEmptyDB: true });

    this._dependents = dependents;

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
