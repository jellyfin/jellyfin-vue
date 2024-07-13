/**
 * This store holds and cache reactive references to all the API layers, provided by the
 * useBaseItem and useRequest composable
 */
import { ImageType, ItemFields, type BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { reactive, watch } from 'vue';
import { isArray, isObj, isStr, sealed } from '@/utils/validation';
import { remote } from '@/plugins/remote';

/**
 * Class that we can use to transform to BaseItem when necessary
 */
@sealed
class CachedResponse {
  public wasArray: boolean | undefined;
  public ids: BaseItemDto['Id'][] = [];
  public rawResult: unknown | undefined;
  public ofBaseItem: boolean;

  public constructor(ofBaseItem: boolean, payload: boolean extends typeof ofBaseItem ? BaseItemDto | BaseItemDto[] : unknown) {
    this.ofBaseItem = ofBaseItem;

    if (this.ofBaseItem) {
      this.wasArray = isArray(payload);
      this.ids = this.wasArray ? (payload as BaseItemDto[]).map(i => i.Id) : [(payload as BaseItemDto).Id];
    } else {
      this.rawResult = payload;
    }
  }
}

/**
 * == CLASS CONSTRUCTOR ==
 */
@sealed
class ApiStore {
  /**
   * == STATE SECTION ==
   */
  /**
   * Maps can be cleared (see this._clear), so no need to perform an structuredClone
   * of the defaultState here
   */
  private readonly _items = reactive(new Map<BaseItemDto['Id'], BaseItemDto>());
  private readonly _requests = reactive(new Map<string, Map<string, CachedResponse>>());
  public readonly apiEnums = Object.freeze({
    fields: Object.freeze(Object.values(ItemFields)),
    images: Object.freeze(Object.values(ImageType))
  });

  /**
   * == GETTERS AND SETTERS ==
   */
  public readonly getItemById = (id: BaseItemDto['Id']): BaseItemDto | undefined =>
    this._items.get(id);

  public readonly getItemsById = (ids: BaseItemDto['Id'][]): (BaseItemDto | undefined)[] =>
    ids.map(id => this._items.get(id));

  public readonly getCachedRequest = (funcName: string, params: string): CachedResponse | undefined =>
    this._requests.get(funcName)?.get(params);

  public readonly getRequest = (cache?: CachedResponse): BaseItemDto | BaseItemDto[] | unknown => {
    if (cache) {
      if (cache.ofBaseItem) {
        const array = cache.ids.map(r => this.getItemById(r));

        return cache.wasArray ? array : array[0];
      }

      return cache.rawResult;
    }
  };

  public readonly findItems = (searchTerm: string): BaseItemDto[] => [...this._items.values()].filter((item: BaseItemDto) => {
    const search = searchTerm.toLowerCase();

    return item.Name?.includes(search) || item.SortName?.includes(search) || item.Overview?.includes(search) || item.Taglines?.includes(search);
  });

  /**
   * == ACTIONS ==
   */
  public readonly baseItemAdd = <T extends BaseItemDto | BaseItemDto[]>(item: T): T => {
    if (isArray(item)) {
      return item.map((i) => {
        this._items.set(i.Id, i);

        return this.getItemById(i.Id);
      }) as T;
    } else {
      this._items.set(item.Id, item);

      return this._items.get(item.Id) as T;
    }
  };

  public readonly requestAdd = <T, U extends BaseItemDto | BaseItemDto[]>(
    funcName: string,
    params: string,
    ofBaseItem: boolean,
    result: U): typeof ofBaseItem extends true ? U : T => {
    const toSave = new CachedResponse(ofBaseItem, result);

    if (this._requests.has(funcName)) {
      this._requests.get(funcName)?.set(params, toSave);
    } else {
      this._requests.set(funcName, new Map([[params, toSave]]));
    }

    return this.getRequest(this.getCachedRequest(funcName, params)) as T;
  };

  public readonly itemDelete = async (itemId: string): Promise<void> => {
    try {
      await remote.sdk.newUserApi(getLibraryApi).deleteItem({
        itemId
      });

      this._items.delete(itemId);

      for (const request of this._requests.values()) {
        for (const [args, result] of request.entries()) {
          if (result.ids.includes(itemId) || args.includes(itemId)) {
            request.delete(args);
          }
        }
      }
    } catch {}
  };

  /**
   * Updates the items in the store. Just a request is enough, as the Axios
   * interceptors already handle updating the item in the store
   *
   * @param itemIds - Ids of the items to update
   */
  private readonly _update = async (itemIds: BaseItemDto['Id'][]): Promise<void> => {
    if (itemIds.length) {
      const { data } = await remote.sdk.newUserApi(getItemsApi).getItems({
        userId: remote.auth.currentUserId,
        ids: itemIds as string[],
        fields: this.apiEnums.fields as ItemFields[],
        enableImageTypes: this.apiEnums.images as ImageType[],
        enableImages: true,
        enableTotalRecordCount: false
      });

      if (isArray(data.Items)) {
        for (const item of data.Items) {
          this.baseItemAdd(item);
        }
      }
    }
  };

  private readonly _clear = (): void => {
    this._items.clear();
    this._requests.clear();
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
          // Update items when metadata changes
          const itemsToUpdate = Data.ItemsUpdated.filter(
            (item: unknown): item is string => isStr(item)
          ).filter(itemId => this._items.has(itemId));

          await this._update(itemsToUpdate);
        } else if (
          MessageType === 'UserDataChanged'
          && 'UserDataList' in Data
          && isArray(Data.UserDataList)
        ) {
          // Update items when their userdata is changed (like, mark as watched, etc)
          const itemsToUpdate = Data.UserDataList.filter(
            (updatedData: unknown): updatedData is { ItemId: string } => {
              if (
                isObj(updatedData)
                && 'ItemId' in updatedData
                && isStr(updatedData.ItemId)
              ) {
                return this._items.has(updatedData.ItemId);
              }

              return false;
            }
          ).map((updatedData) => {
            return updatedData.ItemId;
          });

          await this._update(itemsToUpdate);
        }
      }
    );

    watch(
      () => remote.auth.currentUser,
      () => {
        window.requestAnimationFrame(() => {
          window.setTimeout(() => {
            if (!remote.auth.currentUser) {
              this._clear();
            }
          });
        });
      }, { flush: 'post' }
    );
  }
}

export const apiStore = new ApiStore();
