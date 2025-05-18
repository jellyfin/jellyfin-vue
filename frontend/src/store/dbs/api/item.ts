import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { BaseDbEntity } from '../base-entity';
import type { TApiDatabase } from '.';

export class Item extends BaseDbEntity<TApiDatabase> implements BaseItemDto {
  public static override readonly tableName = 'items';
  declare public Id: string;

  protected get __dbKey() {
    return this.Id;
  }

  /**
   * Creates a new Item instance manually (constructor usage is reserved for Dexie.js)
   * @param db - If provided, saves the created entity to the database
   */
  public static create(item: BaseItemDto, db?: undefined): Item;
  public static create(item: BaseItemDto, db?: TApiDatabase): Promise<Item>;
  public static create(item: BaseItemDto, db?: TApiDatabase): Item | Promise<Item> {
    const instance = new Item(db);

    Object.assign(instance, item);

    if (db) {
      return instance.save();
    }

    return instance;
  }

  /**
   * Only for Dexie.js, use the `create` method instead
   * @internal
   */
  public constructor(db?: TApiDatabase) {
    super(db);
  };
}
