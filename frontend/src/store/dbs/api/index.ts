/**
 * This store holds and cache reactive references to all the API layers, provided by the
 * useBaseItem and useRequest composable
 */
import { ImageType, ItemFields } from '@jellyfin/sdk/lib/generated-client';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { watch } from 'vue';
import { isArray, isObj, sealed } from '@jellyfin-vue/shared/validation';
import { wrap } from 'comlink';
import type { IApiDatabase } from './apidb.worker';
import ApiDatabase from './apidb.worker?worker';
import { remote } from '#/plugins/remote';

/**
 * Contains all the enums used in the API as array constants
 */
export const apiEnums = Object.freeze({
  fields: Object.freeze(Object.values(ItemFields)),
  images: Object.freeze(Object.values(ImageType))
});

const apiDb = wrap<IApiDatabase>(new ApiDatabase());

/**
 * == CLASS CONSTRUCTOR ==
 */
@sealed
class ApiStore {
  /**
   * == GETTERS AND SETTERS ==
   */
  public readonly getItemById = apiDb.getItemById;
  public readonly getItemsById = apiDb.getItemsById;
  public readonly getCachedResponse = apiDb.getCachedResponse;
  public readonly getRequest = apiDb.getRequest;
  public readonly findItems = apiDb.findItems;

  /**
   * == ACTIONS ==
   */
  public readonly baseItemAdd = apiDb.baseItemAdd;
  public readonly requestAdd = apiDb.requestAdd;
  public readonly itemDelete = async (itemId: string): Promise<void> => {
    await remote.sdk.newUserApi(getLibraryApi).deleteItem({
      itemId
    });
    await apiDb.itemDelete(itemId);
  };

  /**
   * Updates the items in the store.
   *
   * @param itemIds - Ids of the items to update
   */
  private readonly _update = async (itemIds: string[]): Promise<void> => {
    const existingIds = await apiDb.getExistingIds(itemIds);

    if (existingIds.length) {
      const { data } = await remote.sdk.newUserApi(getItemsApi).getItems({
        userId: remote.auth.currentUserId.value,
        ids: existingIds,
        fields: apiEnums.fields as ItemFields[],
        enableImageTypes: apiEnums.images as ImageType[],
        enableImages: true,
        enableTotalRecordCount: false
      });

      if (isArray(data.Items)) {
        await this.baseItemAdd(data.Items);
      }
    }
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
          await this._update(Data.UserDataList);
        }
      }
    );
  }
}

export const apiStore = new ApiStore();
