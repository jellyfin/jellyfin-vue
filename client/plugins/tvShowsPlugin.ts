import { AxiosInstance } from 'axios';
import {
  Configuration,
  TvShowsApiGetEpisodesRequest,
  TvShowsApi
} from '@jellyfin/client-axios';
import { Plugin } from '@nuxt/types/app';

type GetEpisodesParams = Omit<TvShowsApiGetEpisodesRequest, 'userId'>;

type TvShowsType = {
  getEpisodes: (requestParameters: GetEpisodesParams) => Promise<string[]>;
};

declare module '@nuxt/types' {
  interface Context {
    $tvShows: TvShowsType;
  }

  interface NuxtAppOptions {
    $tvShows: TvShowsType;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $tvShows: TvShowsType;
  }
}

declare module 'vuex/types/index' {
  // eslint-disable-next-line -- Current TypeScript rules flag S as unused, but Nuxt requires identical types
  interface Store<S> {
    $tvShows: TvShowsType;
  }
}

const itemsPlugin: Plugin = ({ $auth, $axios, store }, inject) => {
  const config = new Configuration();
  const contextAxios = $axios as AxiosInstance;
  const tvShows = new TvShowsApi(config, '', contextAxios);

  inject('tvShows', {
    /**
     * Executes a getItems API call with given parameters, stores the result and returns the ID list
     *
     * @param {object} params - Parameters of getItems API call (without user ID)
     * @returns {string[]} list of IDs
     */
    getEpisodes: async (params: GetEpisodesParams): Promise<string[]> => {
      const result = (
        await tvShows.getEpisodes({ ...params, userId: $auth.user?.Id })
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
