/**
 * This plugin instantiates the Jellyfin SDK.
 * It also sets the header and base URL for our axios instance
 */
import { watchEffect } from 'vue';
import { Api } from '@jellyfin/sdk';
import isNil from 'lodash/isNil';
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

      if (!isNil(server.value) && !isNil(accessToken.value)) {
        this.api = this.sdk.createApi(
          server.value.PublicAddress,
          accessToken.value,
          RemotePluginAxiosInstance.instance
        );
      } else {
        RemotePluginAxiosInstance.resetDefaults();
        this.api = undefined;
      }
    });
  }

  public oneTimeSetup = useOneTimeAPI;
}

const RemotePluginSDKInstance = new RemotePluginSDK(RemotePluginAuthInstance);

export default RemotePluginSDKInstance;
