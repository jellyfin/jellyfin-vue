import { Plugin } from '@nuxt/types';
import { AxiosInstance } from 'axios';
import { UserLibraryApi } from '~/api/api';
import { Configuration } from '~/api/configuration';

declare module '@nuxt/types' {
  interface Context {
    $userLibraryApi: UserLibraryApi;
  }

  interface NuxtAppOptions {
    $userLibraryApi: UserLibraryApi;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $userLibraryApi: UserLibraryApi;
  }
}

const userLibraryApiPlugin: Plugin = (context, inject) => {
  const config = new Configuration();

  const userLibraryApi = new UserLibraryApi(
    config,
    '',
    context.$axios as AxiosInstance
  );
  inject('userLibraryApi', userLibraryApi);
};

export default userLibraryApiPlugin;
