/**
 * This plugin instantiates the Jellyfin SDK.
 * It also sets the header and base URL for our axios instance
 */
import { watchEffect } from 'vue';
import { Api } from '@jellyfin/sdk';
import { isNil } from 'lodash-es';
import RemotePluginAxiosInstance from '../axios';
import RemotePluginAuthInstance from '../auth';
import SDK, { useOneTimeAPI } from './sdk-utils';

class RemotePluginSDK {
  private sdk = SDK;
  public clientInfo = this.sdk.clientInfo;
  public deviceInfo = this.sdk.deviceInfo;
  public discovery = this.sdk.discovery;
  public api: Api | undefined;

  constructor(auth: typeof RemotePluginAuthInstance) {
    /**
     * Configure app's axios instance to perform requests to the given Jellyfin server.
     */
    watchEffect(async () => {
      const server = auth.currentServer;
      const accessToken = auth.currentUserToken;

      if (!isNil(server.value)) {
        this.api = this.sdk.createApi(
          server.value.PublicAddress,
          accessToken.value,
          RemotePluginAxiosInstance.instance
        );
        RemotePluginAxiosInstance.instance.defaults.baseURL =
          server.value.PublicAddress;
      } else {
        RemotePluginAxiosInstance.resetDefaults();
        this.api = undefined;
      }
    });
  }

  public oneTimeSetup = useOneTimeAPI;
  /**
   * Generates a Jellyfin API type with the current API instance.
   *
   * USE WITH CAUTION. Make sure this is only used in places where an user is logged in
   */
  public newUserApi<T>(apiSec: (api: Api) => T): T {
    // @ts-expect-error - We want to explicitly assume the user is already logged in here
    return apiSec(this.api);
  }
}

const RemotePluginSDKInstance = new RemotePluginSDK(RemotePluginAuthInstance);

export default RemotePluginSDKInstance;
