import { Plugin } from '@nuxt/types';
import { AxiosInstance } from 'axios';
import { DisplayPreferencesApi } from '~/api/api';
import { Configuration } from '~/api/configuration';

declare module '@nuxt/types' {
  interface Context {
    $displayPreferencesApi: DisplayPreferencesApi;
  }

  interface NuxtAppOptions {
    $displayPreferencesApi: DisplayPreferencesApi;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $displayPreferencesApi: DisplayPreferencesApi;
  }
}

declare module 'vuex/types/index' {
  interface Store<S> {
    $displayPreferencesApi: DisplayPreferencesApi;
  }
}

const displayPreferencesApiPlugin: Plugin = (context, inject) => {
  const config = new Configuration();

  const displayPreferencesApi = new DisplayPreferencesApi(
    config,
    '',
    context.$axios as AxiosInstance
  );
  inject('displayPreferencesApi', displayPreferencesApi);
};

export default displayPreferencesApiPlugin;
