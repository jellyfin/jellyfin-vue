import { BaseItemDto, ItemFields } from '@jellyfin/sdk/lib/generated-client';
import { defineStore } from 'pinia';
import { authStore } from '.';

export interface ItemsState {
  byId: Record<string, BaseItemDto>;
  collectionById: Record<string, string[]>;
}

export const itemsStore = defineStore('items', {
  state: () => {
    return {
      byId: {},
      collectionById: {}
    } as ItemsState;
  },
  actions: {
    /**
     * Add or update an item or items to the store
     *
     * @param payload
     * @returns - The reactive references
     */
    add(payload: BaseItemDto | BaseItemDto[]): BaseItemDto | BaseItemDto[] {
      const isArray = Array.isArray(payload);

      if (!isArray) {
        // @ts-expect-error - We do the proper typecheck with the isArray variable
        payload = [payload];
      }

      const res = [];

      // @ts-expect-error - We do the proper typecheck with the isArray variable
      for (const item of payload) {
        if (!item.Id) {
          throw new Error("One item doesn't have an id");
        }

        this.byId[item.Id] = item;
        res.push(this.getItemById(item.Id) as BaseItemDto);
      }

      if (res.length === 1 && !isArray) {
        return res[0];
      }

      return res;
    },
    /**
     * Deletes a single or multiple items from the store
     *
     * @param payload
     */
    delete(payload: string | string[]): void {
      if (!Array.isArray(payload)) {
        payload = [payload];
      }

      for (const id of payload) {
        delete this.byId[id];
      }
    },
    /**
     * Associate an item that has children with its children
     *
     * @param parent
     * @param children
     * @returns - The children of the item
     */
    addCollection(parent: BaseItemDto, children: BaseItemDto[]): BaseItemDto[] {
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

      this.collectionById[parent.Id] = childIds;

      return this.getChildrenOfParent(parent.Id) as BaseItemDto[];
    },
    /**
     * Fetches a parent and its children and adds thecollection to the store
     *
     * @param parentId
     */
    async fetchAndAddCollection(
      parentId: string | undefined
    ): Promise<BaseItemDto[] | undefined> {
      const auth = authStore();

      if (parentId && !this.getItemById(parentId)) {
        const parentItem = (
          await this.$nuxt.$api.items.getItems({
            userId: auth.currentUserId,
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
        await this.$nuxt.$api.items.getItems({
          userId: auth.currentUserId,
          parentId,
          fields: Object.values(ItemFields)
        })
      ).data;

      if (childItems.Items) {
        const parent = this.getItemById(parentId);

        return this.addCollection(parent as BaseItemDto, childItems.Items);
      }
    }
  },
  getters: {
    getItemById: (state) => {
      return (id: string | undefined): BaseItemDto | undefined => {
        if (id) {
          return state.byId[id];
        }
      };
    },
    getItemsById: (state) => {
      return (ids: string[]): BaseItemDto[] => {
        const res = [] as BaseItemDto[];

        for (const index of ids) {
          const item = state.byId[index];

          if (!item) {
            throw new Error(`Item ${index} doesn't exist in the store`);
          }

          res.push(item);
        }

        return res;
      };
    },
    getChildrenOfParent: (state) => {
      return (id: string | undefined): BaseItemDto[] | undefined => {
        if (!id) {
          throw new Error('No itemId provided');
        }

        const res = [] as BaseItemDto[];
        const ids = state.collectionById[id];

        if (ids?.length) {
          for (const _id of ids) {
            res.push(state.byId[_id]);
          }

          return res;
        }
      };
    }
  }
});
