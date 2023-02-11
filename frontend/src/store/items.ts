import { computed, ref } from 'vue';
import { cloneDeep } from 'lodash-es';
import { BaseItemDto, ItemFields } from '@jellyfin/sdk/lib/generated-client';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { useRemote } from '@/composables';

/**
 * == INTERFACES ==
 */
interface ItemsState {
  byId: Record<string, BaseItemDto>;
  collectionById: Record<string, string[]>;
}

/**
 * == STATE VARIABLES ==
 */
const defaultState: ItemsState = {
  byId: {},
  collectionById: {}
};

const state = ref<ItemsState>(cloneDeep(defaultState));

/**
 * == CLASS CONSTRUCTOR ==
 */
class ItemsStore {
  /**
   * == GETTERS ==
   */
  public getItemById = (id: string | undefined): BaseItemDto | undefined => {
    return computed(() => (id ? state.value.byId[id] : undefined)).value;
  };

  public getItemsById = (ids: string[]): BaseItemDto[] => {
    return computed(() => {
      const res: BaseItemDto[] = [];

      for (const index of ids) {
        const item = state.value.byId[index];

        if (!item) {
          throw new Error(`Item ${index} doesn't exist in the store`);
        }

        res.push(item);
      }

      return res;
    }).value;
  };

  public getChildrenOfParent = (
    id: string | undefined
  ): BaseItemDto[] | undefined => {
    return computed(() => {
      if (!id) {
        throw new Error('No itemId provided');
      }

      const res: BaseItemDto[] = [];
      const ids = state.value.collectionById[id];

      if (ids?.length) {
        for (const _id of ids) {
          res.push(state.value.byId[_id]);
        }

        return res;
      }
    }).value;
  };

  /**
   * == ACTIONS ==
   */
  /**
   * Add or update an item or items to the store
   *
   * @param payload
   * @returns - The reactive references
   */
  public add = (
    payload: BaseItemDto | BaseItemDto[]
  ): BaseItemDto | BaseItemDto[] => {
    const isArray = Array.isArray(payload);
    const itemArray = isArray ? payload : [payload];

    const res: BaseItemDto[] = [];

    for (const item of itemArray) {
      if (!item.Id) {
        throw new Error("One item doesn't have an id");
      }

      state.value.byId[item.Id] = item;

      const fetched = this.getItemById(item.Id);

      if (!fetched) {
        throw new Error('Expected to receive newly added item to store');
      }

      res.push(fetched);
    }

    if (res.length === 1 && !isArray) {
      return res[0];
    }

    return res;
  };

  /**
   * Deletes a single or multiple items from the store
   *
   * @param payload
   */
  public delete = (payload: string | string[]): void => {
    if (!Array.isArray(payload)) {
      payload = [payload];
    }

    for (const id of payload) {
      delete state.value.byId[id];
    }
  };

  /**
   * Associate an item that has children with its children
   *
   * @param parent
   * @param children
   * @returns - The children of the item
   */
  public addCollection = (
    parent: BaseItemDto,
    children: BaseItemDto[]
  ): BaseItemDto[] => {
    if (!parent.Id) {
      throw new Error("Parent item doesn't have an Id");
    }

    const childIds = [];

    for (const child of children) {
      if (child.Id) {
        if (!this.getItemById(child.Id)) {
          this.add(child);
        }

        childIds.push(child.Id);
      }
    }

    state.value.collectionById[parent.Id] = childIds;

    return this.getChildrenOfParent(parent.Id) ?? [];
  };

  /**
   * Fetches a parent and its children and adds thecollection to the store
   *
   * @param parentId
   */
  public fetchAndAddCollection = async (
    parentId: string | undefined
  ): Promise<BaseItemDto[] | undefined> => {
    const remote = useRemote();

    if (parentId && !this.getItemById(parentId)) {
      const parentItem = (
        await remote.sdk.newUserApi(getItemsApi).getItems({
          userId: remote.auth.currentUserId,
          ids: [parentId],
          fields: Object.values(ItemFields)
        })
      ).data;

      if (!parentItem.Items?.[0]) {
        throw new Error("This parent doesn't exist");
      }

      this.add(parentItem.Items[0]);
    }

    const childItems = (
      await remote.sdk.newUserApi(getItemsApi).getItems({
        userId: remote.auth.currentUserId,
        parentId,
        fields: Object.values(ItemFields)
      })
    ).data;

    if (childItems.Items) {
      const parent = this.getItemById(parentId);

      if (!parent) {
        throw new Error('expected item to be found');
      }

      return this.addCollection(parent, childItems.Items);
    }
  };

  /**
   * Updates the items in the store. Just a request is enough, as the Axios
   * interceptors already handle updating the item in the store
   *
   * @param itemIds - Ids of the items to update
   */
  public updateStoreItems = async (itemIds: string[]): Promise<void> => {
    const remote = useRemote();

    if (itemIds.length > 0) {
      await remote.sdk.newUserApi(getItemsApi).getItems({
        userId: remote.auth.currentUserId,
        ids: itemIds,
        fields: Object.keys(ItemFields) as ItemFields[]
      });
    }
  };
}

const items = new ItemsStore();

export default items;
