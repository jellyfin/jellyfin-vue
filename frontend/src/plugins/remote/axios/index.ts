/**
 * Instantiates the Axios instance used for the SDK and requests
 */
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import axios, { AxiosError, AxiosResponse } from 'axios';
import RemotePluginAuthInstance from '../auth';
import { itemsStore } from '@/store';
import { useSnackbar, usei18n } from '@/composables';

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
        // TODO: Implement a proper check for reponses that are BaseItemDto.
        // This currently will try to cache the values for all response types.
        // The likelyhood of an id cache collision is low but this is caching a lot
        // in memory currently.
        response.data.Items = (data.Items as BaseItemDto[]).map((i) =>
          items.add(i)
        );
      } else if (
        RemotePluginAuthInstance.currentUser &&
        response.config.url?.includes(
          `/Users/${RemotePluginAuthInstance.currentUser?.Id}/Items/`
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
      RemotePluginAuthInstance.currentUser &&
      !error.config.url?.includes('/Sessions/Logout')
    ) {
      await RemotePluginAuthInstance.logoutCurrentUser(true);
      useSnackbar(usei18n().t('login.kickedOut'), 'error');
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

  public constructor() {
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
