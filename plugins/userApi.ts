import { Plugin } from '@nuxt/types';
import { AxiosInstance } from 'axios';
import { UserApi } from '~/api/api';
import { Configuration } from '~/api/configuration';

declare module '@nuxt/types' {
  interface Context {
    $userApi: UserApi;
  }

  interface NuxtAppOptions {
    $userApi: UserApi;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $userApi: UserApi;
  }
}

declare module 'vuex/types/index' {
  interface Store<S> {
    $userApi: UserApi;
  }
}

const userApiPlugin: Plugin = (context, inject) => {
  const config = new Configuration();

  const userApi = new UserApi(config, '', context.$axios as AxiosInstance);
  inject('userApi', userApi);
};

export default userApiPlugin;
