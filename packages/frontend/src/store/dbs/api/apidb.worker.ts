/// <reference lib="WebWorker" />

import type { EntityTable } from 'dexie';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { isArray } from '@jellyfin-vue/shared/validation';
import type { Arrayable } from 'type-fest';
import { expose } from 'comlink';
import { BaseDb } from '../base-db.ts';
import { ApiResponse } from './api-response.ts';
import { Item } from './item.ts';
import { MediaProbe } from './media-probe.ts';
import type { ProbeResult } from '#/utils/playback-capabilities/probe.ts';

class ApiDatabase extends BaseDb {
  declare public responses: EntityTable<ApiResponse, 'function' | 'params'>;
  declare public items: EntityTable<Item, 'Id'>;
  declare public mediaProbes: EntityTable<MediaProbe, 'itemId'>;

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
    if (!cache) {
      return;
    }

    if (cache.ofBaseItem) {
      const array = await this.getItemsById(cache.ids);

      return cache.wasArray ? array : array[0];
    }

    return cache.rawResult;
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

  /**
   * Deletes an item, its dependent rows (its probe results) and its references in the stored responses
   */
  public readonly itemDelete = async (itemId: string): Promise<void> => {
    await this.transaction('rw', this.items, this.responses, this.mediaProbes, async () => {
      await this._deleteWithDependents(Item.tableName, [itemId]);
      await this.responses.where('ids').anyOf(itemId).modify((response) => {
        response.ids = response.ids.filter(id => id !== itemId);
      });
    });
  };

  /**
   * == MEDIA PROBES ==
   */

  /**
   * Gets the stored probe result of a media source, if it was computed for the same version of the file
   *
   * @param etag - The current `ETag` of the media source: a different one means the file changed
   */
  public readonly getMediaProbe = async (
    itemId: string,
    mediaSourceId: string,
    etag: string | null | undefined
  ): Promise<ProbeResult | undefined> => {
    const stored = (await this.mediaProbes.get(itemId))?.sources[mediaSourceId];

    return etag && stored?.etag === etag ? stored.result : undefined;
  };

  /**
   * Stores the probe result of a media source of a stored item. Results that depend on the network are not
   * stored, nor results for items that are not stored (they would be left without owner).
   *
   * @param etag - The `ETag` of the media source the result was computed for
   * @returns Whether the result was stored
   */
  public readonly mediaProbeAdd = async (
    itemId: string,
    mediaSourceId: string,
    etag: string | null | undefined,
    result: ProbeResult
  ): Promise<boolean> => {
    if (!etag || !result.cacheable) {
      return false;
    }

    return await this.transaction('rw', this.items, this.mediaProbes, async () => {
      // Checked by key, without reading the whole item
      if (await this.items.where(':id').equals(itemId).count() === 0) {
        return false;
      }

      const sources = (await this.mediaProbes.get(itemId))?.sources ?? {};

      await this.mediaProbes.put(MediaProbe.create(itemId, { ...sources, [mediaSourceId]: { etag, result } }).__raw);

      return true;
    });
  };

  /**
   * Forgets every stored probe result
   */
  public readonly mediaProbesClear = async (): Promise<void> => {
    await this.mediaProbes.clear();
  };

  public constructor() {
    /**
     * Unique indexes (function and params are composite keys)
     */
    super('api', new Map([
      [ApiResponse, '&[function+params], *ids'],
      [Item, '&Id'],
      [MediaProbe, '&itemId']
    ]), 2, [{ table: MediaProbe.tableName, owner: Item.tableName, ownerKey: 'itemId' }]);
  }
}

const instance = new ApiDatabase();
export default instance;
export type TApiDatabase = ApiDatabase;
export type IApiDatabase = typeof instance;

expose(instance);
