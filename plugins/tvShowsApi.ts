import { Context } from '@nuxt/types';
import { TvShowsApi } from '~/api/api';
import { Configuration } from '~/api/configuration';
import { PluginInjection } from '~/types/utils';

declare module '@nuxt/types' {
  interface Context {
    $tvShowsApi: TvShowsApi;
  }

  interface NuxtAppOptions {
    $tvShowsApi: TvShowsApi;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $tvShowsApi: TvShowsApi;
  }
}

export default (context: Context, inject: PluginInjection): void => {
  const config = new Configuration();

  const tvShowsApi = new TvShowsApi(config, '', context.$axios);
  inject('tvShowsApi', tvShowsApi);
};
