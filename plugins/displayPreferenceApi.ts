import { Context } from '@nuxt/types';
import { DisplayPreferencesApi } from '~/api/api';
import { Configuration } from '~/api/configuration';
import { PluginInjection } from '~/types/utils';

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

export default (context: Context, inject: PluginInjection): void => {
  const config = new Configuration();

  const displayPreferencesApi = new DisplayPreferencesApi(
    config,
    '',
    context.$axios
  );
  inject('displayPreferencesApi', displayPreferencesApi);
};
