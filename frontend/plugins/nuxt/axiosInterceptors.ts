import { Context, Plugin } from '@nuxt/types/app';
import { itemsStore, authStore, snackbarStore } from '~/store';
import { AxiosResponse } from 'axios';
import { BaseItemDto } from '@jellyfin/client-axios';

/**
 * TODO: Add all the item fields to every request related to items
 */

const authPlugin: Plugin = (ctx: Context) => {
  const items = itemsStore();
  const auth = authStore();
  const snackbar = snackbarStore();

  /**
   * Function to run on every successful response
   */
  const onRequestResponse = (response: AxiosResponse<any>) => {
    const data = response.data;
    const userId = ctx.$auth.user?.Id;

    if (data) {
      if (data.Items && Array.isArray(data.Items)) {
        response.data = items.add(data.Items as BaseItemDto[]);
      } else if (
        userId &&
        response.config.url?.includes(`/Users/${userId}/Items/`)
      ) {
        response.data = items.add(data);
      }
    }

    return response;
  };
  /**
   * Function to run on every failed request
   */
  const onRequestError = async (error: any) => {
    if (error.response.status === 401) {
      try {
        await ctx.$api.user.getCurrentUser();
      } catch {
        await auth.logoutUser(true, true);
        snackbar.push(ctx.i18n.t('login.kickedOut'), 'error');
      }
    }

    return error;
  };

  ctx.$axios.interceptors.response.use(onRequestResponse, onRequestError);
};

export default authPlugin;
