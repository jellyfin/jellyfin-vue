import { Context } from '@nuxt/types/app';
import axios, { AxiosResponse, AxiosError, AxiosInstance } from 'axios';
import { BaseItemDto } from '@jellyfin/client-axios';
import { itemsStore, authStore, snackbarStore } from '~/store';

declare module '@nuxt/types' {
  interface Context {
    $axios: AxiosInstance;
  }

  interface NuxtAppOptions {
    $axios: AxiosInstance;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $axios: AxiosInstance;
  }
}

/**
 * TODO:
 * - Add proper progress bar handling back (@nuxtjs/axios didn't handle some cases correctly either)
 * - Switch to https://github.com/thornbill/jellyfin-sdk-typescript
 * - Fix reactivity of items (reactive items are used everywhere now, as they have the _ob property added by Vue, but no changes are detected
 * by components)
 */

export default function (
  ctx: Context,
  inject: (key: string, value: any) => void
) {
  const axiosInstance = axios.create();

  /**
   * Function to run on every successful response
   *
   * @param response
   */
  const onResponse = (response: AxiosResponse): AxiosResponse => {
    const items = itemsStore();
    const auth = authStore();
    const data = response.data;

    if (data) {
      if (data.Items && Array.isArray(data.Items)) {
        response.data.Items = items.add(data.Items as BaseItemDto[]);
      } else if (
        auth.currentUser &&
        response.config.url?.includes(`/Users/${auth.currentUserId}/Items/`)
      ) {
        response.data = items.add(data);
      }
    }

    return response;
  };

  /**
   * Function to run on every failed request
   *
   * @param error
   */
  const onResponseError = async (error: AxiosError): Promise<never | void> => {
    const auth = authStore();
    const snackbar = snackbarStore();

    if (
      error.response?.status === 401 &&
      auth.currentUser &&
      !error.config.url?.includes('/Sessions/Logout')
    ) {
      await auth.logoutCurrentUser(true);
      snackbar.push(ctx.i18n.t('login.kickedOut'), 'error');
    }
    /**
     * Pass the error so it's handled in try/catch blocks afterwards
     */
    throw error;
  };

  axiosInstance.interceptors.response.use(onResponse, onResponseError);

  inject('axios', axiosInstance);
}
