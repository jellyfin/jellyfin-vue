/**
 * The 'remote' plugin includes the tools needed to interact with a Jellyfin
 * server:
 * - Authentication store ($remote.auth)
 * - Axios as the request performer ($remote.axios)
 * - Jellyfin SDK ($remote.sdk)
 * - WebSocket ($remote.socket)
 */
import { App } from 'vue';
import RemotePluginAxiosInstance from './axios';
import RemotePluginAuthInstance from './auth';
import RemotePluginSDKInstance from './sdk';

class RemotePlugin {
  public axios = RemotePluginAxiosInstance;
  public auth = RemotePluginAuthInstance;
  public sdk = RemotePluginSDKInstance;
}

export const remoteInstance = new RemotePlugin();

/**
 * Installs the remote plugin into the Vue instance to enable the usage of
 * $remote to access all the tools for handling a Jellyfin server connection.
 */
export function createRemote(): { install: (app: App) => void } {
  return {
    install: (app: App): void => {
      app.config.globalProperties.$remote = remoteInstance;
    }
  };
}
