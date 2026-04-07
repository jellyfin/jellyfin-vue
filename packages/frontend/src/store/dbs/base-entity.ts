import { isFunc } from '@jellyfin-vue/shared/validation';
import type Dexie from 'dexie';
import type { Entity, IndexableType, Table } from 'dexie';

export abstract class BaseDbEntity<T extends Dexie> implements Partial<Entity<T>> {
  declare public static readonly tableName: string;
  public __timestamp = Date.now();
  /**
   * For use by Dexie.js methods only
   * @internal
   */
  protected abstract __dbKey: IndexableType;
  protected db?: T;

  protected get table(): Table<this, IndexableType, this> | undefined {
    return this.db?.table((this.constructor as typeof BaseDbEntity).tableName);
  }

  /**
   * Gets the serializable object for Dexie.js
   * @internal
   */
  public get __raw() {
    const result = {} as this;

    for (const key in this) {
      if (key === 'db' || isFunc(this[key])) {
        continue;
      }

      result[key] = this[key];
    }

    return result;
  };

  public async save() {
    await this.table?.put(this.__raw);

    return this;
  }

  public async delete() {
    await this.table?.delete(this.__dbKey);
  }

  /**
   * Only for Dexie.js, use the `create` method instead
   * @internal
   */
  public constructor(db?: T) {
    this.db = db;
  }
}
