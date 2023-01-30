/**
 * The 'remote' plugin includes the tools needed to interact with a Jellyfin
 * server:
 * - Authentication store ($remote.auth)
 * - Axios as the request performer ($remote.axios)
 * - Jellyfin SDK ($remote.sdk)
 * - WebSocket ($remote.socket)
 */
import { App } from 'vue';
import { isNil } from 'lodash-es';
import RemotePluginAxiosInstance from './axios';
import RemotePluginAuthInstance from './auth';
import RemotePluginSDKInstance from './sdk';
import RemotePluginSocketInstance from './socket';
import { getJSONConfig } from '@/utils/external-config';

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
    install: async (app: App): Promise<void> => {
      app.config.globalProperties.$remote = remoteInstance;

      const auth = remoteInstance.auth;
      const config = await getJSONConfig();
      const defaultServers = config.defaultServerURLs;
      const missingServers = defaultServers.filter((serverUrl) => {
        const server = auth.servers.find(
          (lsServer) => lsServer.PublicAddress === serverUrl
        );

        return isNil(server);
      });

      for (const serverUrl of missingServers) {
        await auth.connectServer(serverUrl, true);
      }
    }
  };
}
