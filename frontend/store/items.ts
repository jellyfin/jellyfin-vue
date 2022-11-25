import Vue from 'vue';
import { BaseItemDto, ImageType, ItemFields } from '@jellyfin/client-axios';
import { defineStore } from 'pinia';
import { authStore } from '.';

export interface ItemsState {
  byId: Record<string, BaseItemDto>;
  collectionById: Record<string, string[]>;
  playlistById: Record<string, string[]>;
}

export const itemsStore = defineStore('items', {
  state: () => {
    return {
      byId: {},
      collectionById: {},
      playlistById: {}
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

        Vue.set(this.byId, item.Id, item);
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
        Vue.delete(this.byId, id);
      }
    },
    /**
     * Associate an item that has children with its children
     *
     * @param parent
     * @param children
     * @returns - The children of the item
     */
    async movePlaylistItem(
      parent: BaseItemDto,
      localChild: BaseItemDto,
      index: number
    ): Promise<BaseItemDto[]> {
      const auth = authStore();

      // You're probably asking "... but why?"

      // Because when the Playback manager is playing these tracks,
      // it seems to erase the PlaylistItemId from each of the items.
      // So... I just get a new bunch of them to move things.

      // Probably a better way to do it, but...
      // ... I didn't feel like figuring that out right now.

      // If you try to fix this, make sure that you can click "Play"
      // on the playlist, then move tracks.

      const children = await this.$nuxt.$api.playlists.getPlaylistItems({
        userId: auth.currentUserId,
        playlistId: parent.Id as string,
        fields: [ItemFields.PrimaryImageAspectRatio],
        enableImageTypes: [
          ImageType.Primary,
          ImageType.Backdrop,
          ImageType.Banner,
          ImageType.Thumb
        ]
      });
      const child = children.data.Items?.find(
        (i) => i.Id == localChild.Id
      ) as BaseItemDto;
      await this.$nuxt.$api.playlists.moveItem({
        playlistId: parent.Id as string,
        itemId: child.PlaylistItemId as string,
        newIndex: index
      });
      return await this.fetchAndAddPlaylist(parent.Id as string);
    },
    addPlaylist(parent: BaseItemDto, children: BaseItemDto[]): BaseItemDto[] {
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

      Vue.set(this.playlistById, parent.Id, childIds);

      return this.getChildrenOfParentPlaylist(parent.Id) as BaseItemDto[];
    },
    async fetchAndAddPlaylist(
      parentId: string | undefined
    ): Promise<BaseItemDto[]> {
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
        await this.$nuxt.$api.playlists.getPlaylistItems({
          userId: auth.currentUserId,
          playlistId: parentId as string,
          fields: [ItemFields.PrimaryImageAspectRatio],
          enableImageTypes: [
            ImageType.Primary,
            ImageType.Backdrop,
            ImageType.Banner,
            ImageType.Thumb
          ]
        })
      ).data;

      if (childItems.Items) {
        const parent = this.getItemById(parentId);

        return this.addPlaylist(parent as BaseItemDto, childItems.Items);
      } else {
        // I think this just means it's an empty playlist...?
        return this.addPlaylist(parent as BaseItemDto, []);
      }
    },
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

      return this.getChildrenOfParentCollection(parent.Id) as BaseItemDto[];
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

        for (const i of ids) {
          const item = state.byId[i];

          if (!item) {
            throw new Error(`Item ${i} doesn't exist in the store`);
          }

          res.push(item);
        }

        return res;
      };
    },
    getChildrenOfParentCollection: (state) => {
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
    },
    getChildrenOfParentPlaylist: (state) => {
      return (id: string | undefined): BaseItemDto[] | undefined => {
        if (!id) {
          throw new Error('No itemId provided');
        }

        const res = [] as BaseItemDto[];
        const ids = state.playlistById[id];

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
