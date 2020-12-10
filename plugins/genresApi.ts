import { Plugin } from '@nuxt/types';
import { AxiosInstance } from 'axios';
import { GenresApi } from '~/api/api';
import { Configuration } from '~/api/configuration';

declare module '@nuxt/types' {
  interface Context {
    $genresApi: GenresApi;
  }

  interface NuxtAppOptions {
    $genresApi: GenresApi;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $genresApi: GenresApi;
  }
}

const genresApiPlugin: Plugin = (context, inject) => {
  const config = new Configuration();

  const genresApi = new GenresApi(config, '', context.$axios as AxiosInstance);
  inject('genresApi', genresApi);
};

export default genresApiPlugin;
