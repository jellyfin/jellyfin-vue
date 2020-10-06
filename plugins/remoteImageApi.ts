import { Plugin } from '@nuxt/types';
import { AxiosInstance } from 'axios';
import { RemoteImageApi } from '~/api/api';
import { Configuration } from '~/api/configuration';

declare module '@nuxt/types' {
  interface Context {
    $remoteImageApi: RemoteImageApi;
  }

  interface NuxtAppOptions {
    $remoteImageApi: RemoteImageApi;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $remoteImageApi: RemoteImageApi;
  }
}

const remoteImageApiPlugin: Plugin = (context, inject) => {
  const config = new Configuration();

  const remoteImageApi = new RemoteImageApi(
    config,
    '',
    context.$axios as AxiosInstance
  );
  inject('remoteImageApi', remoteImageApi);
};

export default remoteImageApiPlugin;
