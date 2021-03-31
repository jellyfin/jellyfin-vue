import { ItemsApiGetItemsRequest } from '@jellyfin/client-axios';
import { Plugin } from '@nuxt/types/app';

type GetItemsParams = Omit<ItemsApiGetItemsRequest, 'userId'>;

type ItemsType = {
  getItems: (params: GetItemsParams) => Promise<string[]>;
};

declare module '@nuxt/types' {
  interface Context {
    $items: ItemsType;
  }

  interface NuxtAppOptions {
    $items: ItemsType;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $items: ItemsType;
  }
}

declare module 'vuex/types/index' {
  // eslint-disable-next-line -- Current TypeScript rules flag S as unused, but Nuxt requires identical types
  interface Store<S> {
    $items: ItemsType;
  }
}

const itemsPlugin: Plugin = ({ $api, $auth, store }, inject) => {
  inject('items', {
    /**
     * Executes a getItems API call with given parameters, stores the result and returns the ID list
     *
     * @param {object} params - Parameters of getItems API call (without user ID)
     * @returns {string[]} list of IDs
     */
    getItems: async (params: GetItemsParams): Promise<string[]> => {
      const result = (
        await $api.items.getItems({ ...params, userId: $auth.user?.Id })
      ).data.Items;

      if (!result) {
        return [];
      }

      await store.dispatch('items/addItems', { items: result });

      return result.reduce((acc, value) => {
        if (value?.Id) {
          // @ts-expect-error - The parser fails to infer types properly here.
          acc.push(value.Id);
        }

        return acc;
      }, []);
    }
  });
};

export default itemsPlugin;
