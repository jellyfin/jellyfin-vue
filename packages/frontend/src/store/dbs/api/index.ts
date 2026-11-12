/**
 * This store wraps the apiDb WebWorker reactively,
 * providing cached reactive references to all the API layers.
 * Those are usable through the useBaseItem and useRequest composable,
 * read their documentation for more information.
 */
import { ImageType, ItemFields } from '@jellyfin/sdk/lib/generated-client';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { toRaw, watch } from 'vue';
import { isArray, isObj, sealed } from '@jellyfin-vue/shared/validation';
import { wrap } from 'comlink';
import { useSessionStorage } from '@vueuse/core';
import type { IApiDatabase } from './apidb.worker.ts';
import ApiDatabase from './apidb.worker.ts?worker';
import { remote } from '#/plugins/remote/index.ts';
import type { ProbeResult } from '#/utils/playback-capabilities/probe.ts';

/**
 * Contains all the enums used in the API as array constants
 */
export const apiEnums = Object.freeze({
  fields: Object.freeze(Object.values(ItemFields)),
  images: Object.freeze(Object.values(ImageType))
});

const apiDb = wrap<IApiDatabase>(new ApiDatabase());
/**
 * You need to update this array whenever a new item has been modified
 * in the database so components can subscribe to updates.
 * We use SessionStorage so it's refreshed across tabs.
 *
 * TODO: Simplify this once PWA is implemented, perhaps switch to
 * BroadcastChannel
 */
export const lastUpdatedIds = useSessionStorage<string[]>('lastUpdatedIds', [], { shallow: true });

/**
 * == CLASS CONSTRUCTOR ==
 */
@sealed
class ApiStore {
  /* We add a call to lastUpdatedIds inside the getters so dependencies are tracked */
  /* eslint-disable @typescript-eslint/no-unused-expressions */
  /**
   * == GETTERS AND SETTERS ==
   */
  public readonly getItemById: IApiDatabase['getItemById']
    = async (...args) => {
      lastUpdatedIds.value;

      // @ts-expect-error - Incorrect inference by TypeScript
      return await apiDb.getItemById(...args.map(a => toRaw(a)));
    };

  public readonly getItemsById: IApiDatabase['getItemsById']
    = async (...args) => {
      lastUpdatedIds.value;

      // @ts-expect-error - Incorrect inference by TypeScript
      return await apiDb.getItemsById(...args.map(a => toRaw(a)));
    };

  public readonly getCachedRequest: IApiDatabase['getCachedRequest']
    = async (...args) => {
      lastUpdatedIds.value;

      // @ts-expect-error - Incorrect inference by TypeScript
      return await apiDb.getCachedRequest(...args.map(a => toRaw(a)));
    };

  public readonly findItems: IApiDatabase['findItems']
    = async (...args) => {
      lastUpdatedIds.value;

      // @ts-expect-error - Incorrect inference by TypeScript
      return await apiDb.findItems(...args.map(a => toRaw(a)));
    };
  /* eslint-enable @typescript-eslint/no-unused-expressions */

  /**
   * == ACTIONS ==
   */
  public readonly baseItemAdd = apiDb.baseItemAdd;
  public readonly requestAdd = apiDb.requestAdd;
  private readonly _notifyUpdates = (ids: string[]) => {
    lastUpdatedIds.value = ids;
  };

  public readonly itemDelete = async (itemId: string): Promise<void> => {
    await remote.sdk.newUserApi(getLibraryApi).deleteItem({
      itemId
    });
    await apiDb.itemDelete(itemId);
    this._notifyUpdates([itemId]);
  };

  /**
   * Updates the items in the store.
   *
   * @param itemIds - Ids of the items to update
   */
  private readonly _update = async (itemIds: string[]): Promise<void> => {
    const existingIds = await apiDb.getExistingIds(itemIds);

    if (existingIds.length) {
      const { data } = await remote.sdk.newUserApi(getLibraryApi).getItems({
        userId: remote.auth.currentUserId.value,
        ids: existingIds,
        fields: apiEnums.fields as ItemFields[],
        enableImageTypes: apiEnums.images as ImageType[],
        enableImages: true,
        enableTotalRecordCount: false
      });

      if (isArray(data.Items)) {
        await this.baseItemAdd(data.Items);
        this._notifyUpdates(existingIds);
      }
    }
  };

  /**
   * == MEDIA PROBES ==
   * Probe results are stored next to the items they belong to and deleted with them.
   */

  /**
   * Gets the stored probe result of a media source, if it was computed for its current `ETag`
   */
  public readonly getMediaProbe = async (
    itemId: string,
    mediaSourceId: string,
    etag: string | null | undefined
  ): Promise<ProbeResult | undefined> => await apiDb.getMediaProbe(itemId, mediaSourceId, etag);

  /**
   * Stores the probe result of a media source of a stored item, if it does not depend on the network
   *
   * @returns Whether the result was stored
   */
  public readonly mediaProbeAdd = async (
    itemId: string,
    mediaSourceId: string,
    etag: string | null | undefined,
    result: ProbeResult
  ): Promise<boolean> => await apiDb.mediaProbeAdd(itemId, mediaSourceId, etag, toRaw(result));

  /**
   * Forgets every stored probe result ("forget learned compatibility")
   */
  public readonly mediaProbesClear = async (): Promise<void> => {
    await apiDb.mediaProbesClear();
  };

  public constructor() {
    watch(
      remote.socket.message,
      async () => {
        if (!remote.socket.message.value) {
          return;
        }

        const { MessageType, Data } = remote.socket.message.value;

        if (!Data || !isObj(Data)) {
          return;
        }

        if (
          MessageType === 'LibraryChanged'
          && 'ItemsUpdated' in Data
          && isArray(Data.ItemsUpdated)
        ) {
          await this._update(Data.ItemsUpdated);
        } else if (
          MessageType === 'UserDataChanged'
          && 'UserDataList' in Data
          && isArray(Data.UserDataList)
        ) {
          await this._update(Data.UserDataList.map(userData => userData.ItemId));
        }
      }
    );
  }
}

export const apiStore = new ApiStore();
