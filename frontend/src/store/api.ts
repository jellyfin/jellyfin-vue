/**
 * This store holds and cache reactive references to all the API layers, provided by the
 * useBaseItem and useRequest composable
 */
import { remote } from '@/plugins/remote';
import { ImageType, ItemFields, type BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { reactive, watch } from 'vue';

/**
 * Class that we can use to transform to BaseItem when necessary
 */
class RawBaseItemResponse {
  public wasArray: boolean;
  public ids: BaseItemDto['Id'][];

  public constructor(payload: BaseItemDto | BaseItemDto[]) {
    this.wasArray = Array.isArray(payload);
    this.ids = this.wasArray ? (payload as BaseItemDto[]).map((i) => i.Id) : [(payload as BaseItemDto).Id];
  }
}

/**
 * == INTERFACES AND TYPES ==
 */
interface ApiState {
  items: Map<BaseItemDto['Id'], BaseItemDto>;
  requests: Map<string, Map<string, unknown | RawBaseItemResponse>>;
}

/**
 * == CLASS CONSTRUCTOR ==
 */
class ApiStore {
  /**
   * == STATE SECTION ==
   */
  private _defaultState: ApiState = {
    items: new Map<BaseItemDto['Id'], BaseItemDto>(),
    requests: new Map<string, Map<string, unknown | RawBaseItemResponse>>()
  };
  /**
   * Maps can be cleared (see this._clear), so no need to perform an structuredClone
   * of the defaultState here
   */
  private _state = reactive<ApiState>(this._defaultState);

  public apiEnums = Object.freeze({
    fields: Object.freeze(Object.values(ItemFields)),
    images: Object.freeze(Object.values(ImageType))
  });

  /**
   * == GETTERS AND SETTERS ==
   */
  public getItemById = (id: BaseItemDto['Id']): BaseItemDto | undefined =>
    this._state.items.get(id);

  public getItemsById = (ids: BaseItemDto['Id'][]): Array<BaseItemDto | undefined> =>
    ids.map((id) => this._state.items.get(id));

  public getRequest = (funcName: string, params: string): unknown => {
    const result = this._state.requests.get(funcName)?.get(params);

    if (result instanceof RawBaseItemResponse) {
      const array = result.ids.map((r) => this.getItemById(r));

      return result.wasArray ? array : array[0];
    }

    return result;
  };

  /**
   * == ACTIONS ==
   */
  public baseItemAdd = <T extends BaseItemDto | BaseItemDto[]>(item: T): T => {
    if (Array.isArray(item)) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      for (const i of (item as BaseItemDto[])) {
        this._state.items.set(i.Id, i);
      }

      return this.getItemsById(item.map((i) => i.Id)) as T;
    } else {
      this._state.items.set(item.Id, item);

      return this._state.items.get(item.Id) as T;
    }
  };

  public requestAdd = <T, U extends BaseItemDto | BaseItemDto[]>(
    funcName: string,
    params: string,
    ofBaseItem: boolean,
    result: U): typeof ofBaseItem extends true ? U : T => {
    const toSave = ofBaseItem ? new RawBaseItemResponse(result) : result;

    if (this._state.requests.has(funcName)) {
      this._state.requests.get(funcName)?.set(params, toSave);
    } else {
      this._state.requests.set(funcName, new Map([[params, toSave]]));
    }

    return this.getRequest(funcName, params) as T;
  };

  public itemDelete = async (itemId: string): Promise<void> => {
    try {
      await remote.sdk.newUserApi(getLibraryApi).deleteItem({
        itemId
      });

      this._state.items.delete(itemId);

      for (const request of this._state.requests.values()) {
        for (const [args, result] of request.entries()) {
          if (result instanceof RawBaseItemResponse && result.ids.includes(itemId) || args.includes(itemId)) {
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
  private _update = async (itemIds: BaseItemDto['Id'][]): Promise<void> => {
    if (itemIds.length > 0) {
      const { data } = await remote.sdk.newUserApi(getItemsApi).getItems({
        userId: remote.auth.currentUserId,
        ids: itemIds as string[],
        fields: this.apiEnums.fields as ItemFields[]
      });

      if (Array.isArray(data.Items)) {
        for (const item of data.Items) {
          this.baseItemAdd(item);
        }
      }
    }
  };

  private _clear = (): void => {
    this._state.items.clear();
    this._state.requests.clear();
  };

  public constructor() {
    watch(
      () => remote.socket.message,
      async () => {
        if (!remote.socket.message) {
          return;
        }

        const { MessageType, Data } = remote.socket.message;

        if (!Data || typeof Data !== 'object') {
          return;
        }

        if (
          MessageType === 'LibraryChanged' &&
          'ItemsUpdated' in Data &&
          Array.isArray(Data.ItemsUpdated)
        ) {
          // Update items when metadata changes
          const itemsToUpdate = Data.ItemsUpdated.filter(
            (item: unknown): item is string => typeof item === 'string'
          ).filter((itemId) => this._state.items.has(itemId));

          await this._update(itemsToUpdate);
        } else if (
          MessageType === 'UserDataChanged' &&
          'UserDataList' in Data &&
          Array.isArray(Data.UserDataList)
        ) {
          // Update items when their userdata is changed (like, mark as watched, etc)
          const itemsToUpdate = Data.UserDataList.filter(
            (updatedData: unknown): updatedData is { ItemId: string } => {
              if (
                typeof updatedData === 'object' &&
                  updatedData &&
                  'ItemId' in updatedData &&
                  typeof updatedData.ItemId === 'string'
              ) {
                return this._state.items.has(updatedData.ItemId);
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
        if (!remote.auth.currentUser) {
          this._clear();
        }
      }
    );
  }
}

export const apiStore = new ApiStore();
