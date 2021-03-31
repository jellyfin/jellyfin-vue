import { UserLibraryApiGetLatestMediaRequest } from '@jellyfin/client-axios';
import { Plugin } from '@nuxt/types/app';

type GetLatestMediaParams = Omit<UserLibraryApiGetLatestMediaRequest, 'userId'>;

type UserLibraryType = {
  getItem: (id: string, force?: boolean) => Promise<void>;
  getLatestMedia: (params: GetLatestMediaParams) => Promise<string[]>;
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
    getItem: async (id: string): Promise<void> => {
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
     * Executes a getLatestMedia API call with given parameters, stores the result and returns the ID list
     *
     * @param {object} params - Parameters of getLatestMedia API call (without user ID)
     * @returns {string[]} list of IDs
     */
    getLatestMedia: async (params: GetLatestMediaParams): Promise<string[]> => {
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

export default userLibraryPlugin;
