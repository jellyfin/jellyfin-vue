/**
 * Instantiates the Axios instance used for the SDK and requests
 */
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig
} from 'axios';
import remote from '../auth';
import { itemsStore } from '@/store';
import { useSnackbar, usei18n, useLoading } from '@/composables';
import { excludedProgressEndpoints } from '@/composables/use-loading';

class JellyfinInterceptors {
  public startLoadInterceptor(
    config: InternalAxiosRequestConfig
  ): InternalAxiosRequestConfig {
    if (config.url) {
      const loading = useLoading();
      const isExcluded = excludedProgressEndpoints.some((i) =>
        config.url?.includes(i)
      );

      if (!isExcluded) {
        loading.start();
      }
    }

    return config;
  }
  public stopLoadInterceptor(response: AxiosResponse): AxiosResponse {
    if (response.config.url) {
      const loading = useLoading();
      const isExcluded = excludedProgressEndpoints.some((i) =>
        response.config.url?.includes(i)
      );

      if (!isExcluded) {
        loading.finish();
      }
    }

    return response;
  }
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
        remote.currentUserId &&
        response.config.url?.includes(`/Users/${remote.currentUserId}/Items/`)
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
      remote.currentUser &&
      !error.config?.url?.includes('/Sessions/Logout')
    ) {
      await remote.logoutCurrentUser(true);
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
  private readonly _interceptors = new JellyfinInterceptors();
  private readonly _defaults = this.instance.defaults;
  private _reactiveInterceptor = -1;
  private _logoutInterceptor = -1;
  private _startLoadInterceptor = -1;
  private _stopLoadInterceptor = -1;

  public constructor() {
    this.setLoadInterceptor();
    this.setReactiveItemsInterceptor();
    this.setLogoutInteceptor();
  }

  public resetDefaults(): void {
    this.instance.defaults = this._defaults;
  }

  public setLoadInterceptor(): void {
    this._startLoadInterceptor = this.instance.interceptors.request.use(
      this._interceptors.startLoadInterceptor
    );
    this._stopLoadInterceptor = this.instance.interceptors.response.use(
      this._interceptors.stopLoadInterceptor
    );
  }

  public removeLoadInterceptor(): void {
    this.instance.interceptors.request.eject(this._startLoadInterceptor);
    this.instance.interceptors.response.eject(this._stopLoadInterceptor);
    this._startLoadInterceptor = -1;
    this._stopLoadInterceptor = -1;
  }

  public setReactiveItemsInterceptor(): void {
    this._reactiveInterceptor = this.instance.interceptors.response.use(
      this._interceptors.reactiveItemsInterceptor
    );
  }

  public removeReactiveItemsInterceptor(): void {
    this.instance.interceptors.response.eject(this._reactiveInterceptor);
    this._reactiveInterceptor = -1;
  }

  public setLogoutInteceptor(): void {
    this._logoutInterceptor = this.instance.interceptors.response.use(
      undefined,
      this._interceptors.logoutInterceptor
    );
  }

  public removeLogoutInterceptor(): void {
    this.instance.interceptors.response.eject(this._logoutInterceptor);
  }
}

const RemotePluginAxiosInstance = new RemotePluginAxios();

export default RemotePluginAxiosInstance;
