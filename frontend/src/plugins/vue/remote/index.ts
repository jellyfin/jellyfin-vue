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
import RemotePluginSocketInstance from './socket';

class RemotePlugin {
  public axios = RemotePluginAxiosInstance;
  public auth = RemotePluginAuthInstance;
  public sdk = RemotePluginSDKInstance;
  public socket = RemotePluginSocketInstance;
}

export const remoteInstance = new RemotePlugin();

/**
 * Installs the remote plugin into the Vue instance to enable the usage of
 * $remote to access all the tools for handling a Jellyfin server connection.
 */
export default function createRemote(): { install: (app: App) => void } {
  return {
    install: (app: App): void => {
      app.config.globalProperties.$remote = remoteInstance;
    }
  };
}
