import Vue from 'vue';
import { BaseItem, BaseItemDto, ItemFields } from '@jellyfin/client-axios';
import { defineStore } from 'pinia';
import { authStore } from '.';

export interface ItemsState {
  byId: Record<string, BaseItemDto>;
  collectionById: Record<string, string[]>;
}

const allFields = Object.values(ItemFields);

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
     * @returns - The reactive references
     */
    add(payload: BaseItemDto | BaseItemDto[]): BaseItemDto | BaseItemDto[] {
      if (!Array.isArray(payload)) {
        payload = [payload];
      }

      const res = [];

      for (const item of payload) {
        if (!item.Id) {
          throw new Error("One item doesn't have an id");
        }

        Vue.set(this.byId, item.Id, item);
        res.push(this.getItemById(item.Id) as BaseItemDto);
      }

      if (res.length === 1 && !Array.isArray(payload)) {
        return res[0];
      }

      return res;
    },
    /**
     * Deletes a single or multiple items from the store
     */
    delete(payload: string | string[]): void {
      if (!Array.isArray(payload)) {
        payload = [payload];
      }

      for (const id of payload) {
        Vue.delete(this.byId, id);
      }
    },
    /**
     * Associate an item that has children with its children
     *
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

      Vue.set(this.collectionById, parent.Id, childIds);

      return this.getChildrenOfParent(parent.Id) as BaseItemDto[];
    },
    /**
     * Fetches a parent and its children and adds thecollection to the store
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
            fields: allFields
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
          fields: allFields
        })
      ).data;

      if (childItems.Items) {
        return this.add(childItems.Items) as BaseItemDto[];
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

        for (const id of ids) {
          const item = state.byId[id];

          if (!item) {
            throw new Error(`Item ${id} doesn't exist in the store`);
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

        if (ids) {
          for (const id of ids) {
            res.push(state.byId[id]);
          }
        }

        return res;
      };
    }
  }
});
