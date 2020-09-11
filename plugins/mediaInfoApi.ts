import { Plugin } from '@nuxt/types';
import { AxiosInstance } from 'axios';
import { MediaInfoApi } from '~/api/api';
import { Configuration } from '~/api/configuration';

declare module '@nuxt/types' {
  interface Context {
    $mediaInfoApi: MediaInfoApi;
  }

  interface NuxtAppOptions {
    $mediaInfoApi: MediaInfoApi;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $mediaInfoApi: MediaInfoApi;
  }
}

const mediaInfoApiPlugin: Plugin = (context, inject) => {
  const config = new Configuration();

  const mediaInfoApi = new MediaInfoApi(
    config,
    '',
    context.$axios as AxiosInstance
  );
  inject('mediaInfoApi', mediaInfoApi);
};

export default mediaInfoApiPlugin;
