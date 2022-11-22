/**
 * Instantiates the Axios instance used for the SDK and requests
 */
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { useI18n } from 'vue-i18n';
import RemotePluginAuthInstance from '../auth';
import { itemsStore } from '@/store';
import { useSnackbar } from '@/composables';

class JellyfinInterceptors {
  /**
   * Intercepts each request that has BaseItemDto, adding the objects to the item store, so they can
   * be reactive and updated using the WebSocket connection
   */
  public reactiveItemsInterceptor(response: AxiosResponse): AxiosResponse {
    const items = itemsStore();
    const data = response.data;

    if (data) {
      if (data.Items && Array.isArray(data.Items)) {
        response.data.Items = items.add(data.Items as BaseItemDto[]);
      } else if (
        RemotePluginAuthInstance.currentUser.value &&
        response.config.url?.includes(
          `/Users/${RemotePluginAuthInstance.currentUser.value}/Items/`
        )
      ) {
        response.data = items.add(data);
      }
    }

    return response;
  }

  /**
   * Intercepts 401 (Unathorized) error code and logs out the user inmmediately,
   * as the session probably has been revoked remotely.
   */
  public async logoutInterceptor(error: AxiosError): Promise<never | void> {
    if (
      error.response?.status === 401 &&
      RemotePluginAuthInstance.currentUser.value &&
      !error.config.url?.includes('/Sessions/Logout')
    ) {
      await RemotePluginAuthInstance.logoutCurrentUser(true);
      useSnackbar(useI18n().t('login.kickedOut'), 'error');
    }

    /**
     * Pass the error so it's handled in try/catch blocks afterwards
     */
    throw error;
  }
}

class RemotePluginAxios {
  public readonly instance = axios.create();
  private readonly interceptors = new JellyfinInterceptors();
  private readonly defaults = this.instance.defaults;
  private reactiveInterceptor = -1;
  private logoutInterceptor = -1;

  constructor() {
    this.setReactiveItemsInterceptor();
    this.setLogoutInteceptor();
  }

  public resetDefaults(): void {
    this.instance.defaults = this.defaults;
  }

  public setReactiveItemsInterceptor(): void {
    this.reactiveInterceptor = this.instance.interceptors.response.use(
      this.interceptors.reactiveItemsInterceptor
    );
  }

  public removeReactiveItemsInterceptor(): void {
    this.instance.interceptors.response.eject(this.reactiveInterceptor);
    this.reactiveInterceptor = -1;
  }

  public setLogoutInteceptor(): void {
    this.logoutInterceptor = this.instance.interceptors.response.use(
      undefined,
      this.interceptors.logoutInterceptor
    );
  }

  public removeLogoutInterceptor(): void {
    this.instance.interceptors.response.eject(this.logoutInterceptor);
  }
}

const RemotePluginAxiosInstance = new RemotePluginAxios();

export default RemotePluginAxiosInstance;
