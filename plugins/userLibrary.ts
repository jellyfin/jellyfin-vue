import {
  ItemsApiGetItemsRequest,
  UserLibraryApiGetLatestMediaRequest
} from '@jellyfin/client-axios';
import { Plugin } from '@nuxt/types/app';

type GetItemsParams = Omit<ItemsApiGetItemsRequest, 'userId'>;
type GetLatestMediaParams = Omit<UserLibraryApiGetLatestMediaRequest, 'userId'>;

type UserLibraryType = {
  fetchItem: (id: string) => Promise<void>;
  fetchItems: (params: GetItemsParams) => Promise<string[]>;
  fetchLatestMedia: (params: GetLatestMediaParams) => Promise<string[]>;
};

declare module '@nuxt/types' {
  interface Context {
    $userLibrary: UserLibraryType;
  }

  interface NuxtAppOptions {
    $userLibrary: UserLibraryType;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $userLibrary: UserLibraryType;
  }
}

declare module 'vuex/types/index' {
  // eslint-disable-next-line -- Current TypeScript rules flag S as unused, but Nuxt requires identical types
  interface Store<S> {
    $userLibrary: UserLibraryType;
  }
}

const userLibraryPlugin: Plugin = ({ $api, $auth, store }, inject) => {
  inject('userLibrary', {
    /**
     * Fetches an item based on its ID and stores it
     *
     * @param {string} id - Item ID
     */
    fetchItem: async (id: string): Promise<void> => {
      const call = async (): Promise<void> => {
        const item = (
          await $api.userLibrary.getItem({
            userId: $auth.user?.Id,
            itemId: id
          })
        ).data;
        await store.dispatch('items/addItem', { item });
      };
      const promise = call();
      if (!store.getters['items/getItem'](id)) {
        await promise;
      }
    },

    /**
     * Executes a getItems API call with given parameters, stores the result and returns the ID list
     *
     * @param {object} params - Parameters of getItems API call (without user ID)
     * @returns {string[]} list of IDs
     */
    fetchItems: async (params: GetItemsParams): Promise<string[]> => {
      const result = (
        await $api.items.getItems({ ...params, userId: $auth.user?.Id })
      ).data.Items;
      if (!result) {
        return [];
      }
      await store.dispatch('items/addItems', { items: result });
      // @ts-expect-error - stupid parser thinking it'll be an (undefined|string)[] when I explicitly filter them
      return result.filter((item) => item?.Id).map((item) => item.Id);
    },

    /**
     * Executes a getLatestMedia API call with given parameters, stores the result and returns the ID list
     *
     * @param {object} params - Parameters of getLatestMedia API call (without user ID)
     * @returns {string[]} list of IDs
     */
    fetchLatestMedia: async (
      params: GetLatestMediaParams
    ): Promise<string[]> => {
      const result = (
        await $api.userLibrary.getLatestMedia({
          ...params,
          userId: $auth.user?.Id
        })
      ).data;
      if (!result) {
        return [];
      }
      await store.dispatch('items/addItems', { items: result });
      // @ts-expect-error - TypeScript badly infers types here, we are already filtering out undefined IDs
      return result.filter((item) => item?.Id).map((item) => item.Id);
    }
  });
};

export default userLibraryPlugin;
