/// <reference lib="WebWorker" />

import type { EntityTable } from 'dexie';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { isArray } from '@jellyfin-vue/shared/validation';
import type { Arrayable } from 'type-fest';
import { expose } from 'comlink';
import { BaseDb } from '../base-db';
import { ApiResponse } from './api-response';
import { Item } from './item';

class ApiDatabase extends BaseDb {
  declare public responses: EntityTable<ApiResponse, 'function' | 'params'>;
  declare public items: EntityTable<Item, 'Id'>;

  /**
   * == GETTERS AND SETTERS ==
   */
  public readonly getItemById = async (id: BaseItemDto['Id']): Promise<BaseItemDto | undefined> =>
    id ? (await this.items.get(id))?.__raw : undefined;

  public readonly getItemsById = async (ids: BaseItemDto['Id'][]): Promise<(BaseItemDto | undefined)[]> =>
    // @ts-expect-error - TODO: Fix this upstream at SDK
    (await this.items.bulkGet(ids)).map(item => item?.__raw);

  private readonly _getCachedResponse = async (funcName: string, params: string) =>
    (await this.responses.where({
      function: funcName,
      params
    }).first())?.__raw;

  /**
   * From an array of ids, gets the ones that exist in the database
   */
  public readonly getExistingIds = async (itemIds: string[]) =>
    await this.items.where('Id').anyOf(itemIds).primaryKeys();

  private readonly _getRequest = async (cache?: ApiResponse) => {
    if (cache) {
      if (cache.ofBaseItem) {
        const array = await this.getItemsById(cache.ids);

        return cache.wasArray ? array : array[0];
      }

      return cache.rawResult;
    }
  };

  public readonly getCachedRequest = async (funcName: string, params: string) =>
    this._getRequest(await this._getCachedResponse(funcName, params));

  public readonly findItems = async (searchTerm: string): Promise<BaseItemDto[]> =>
    (await this.items.filter((item: Item) => {
      const search = searchTerm.toLowerCase();

      return item.Name?.includes(search) || item.SortName?.includes(search) || item.Overview?.includes(search) || item.Taglines?.includes(search);
    }).toArray()).map(i => i.__raw);

  /**
   * == ACTIONS ==
   */
  public readonly baseItemAdd = async (item: BaseItemDto | BaseItemDto[]) => {
    await (isArray(item)
      ? this.items.bulkPut(item.map(i => Item.create(i).__raw))
      : Item.create(item, this));
  };

  public readonly requestAdd = async <U extends Arrayable<BaseItemDto>>(
    funcName: string,
    params: string,
    ofBaseItem: boolean,
    result: U): Promise<typeof ofBaseItem extends true ? U : unknown> => {
    return (await ApiResponse.create(ofBaseItem, {
      function: funcName,
      params,
      payload: result
    }, this)).__raw;
  };

  public readonly itemDelete = async (itemId: string): Promise<void> => {
    await this.items.delete(itemId);
    await this.responses.where('ids').anyOf(itemId).modify((response) => {
      response.ids = response.ids.filter(id => id !== itemId);
    });
  };

  public constructor() {
    /**
     * Unique indexes (function and params are composite keys)
     */
    super('api', new Map([
      [ApiResponse, '&[function+params], *ids'],
      [Item, '&Id']
    ]));
  }
}

const instance = new ApiDatabase();
export default instance;
export type TApiDatabase = ApiDatabase;
export type IApiDatabase = typeof instance;

expose(instance);
