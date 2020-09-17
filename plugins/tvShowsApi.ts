import { Plugin } from '@nuxt/types';
import { AxiosInstance } from 'axios';
import { TvShowsApi } from '~/api/api';
import { Configuration } from '~/api/configuration';

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

const tvShowsApiPlugin: Plugin = (context, inject) => {
  const config = new Configuration();

  const tvShowsApi = new TvShowsApi(
    config,
    '',
    context.$axios as AxiosInstance
  );
  inject('tvShowsApi', tvShowsApi);
};

export default tvShowsApiPlugin;
