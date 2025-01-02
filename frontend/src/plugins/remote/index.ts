/**
 * The 'remote' plugin includes the tools needed to interact with a Jellyfin
 * server:
 * - Authentication store ($remote.auth)
 * - Axios as the request performer ($remote.axios)
 * - Jellyfin SDK ($remote.sdk)
 * - WebSocket ($remote.socket)
 */
import type { App } from 'vue';
import { isNil, sealed } from '@jellyfin-vue/shared/validation';
import RemotePluginAuthInstance from './auth';
import RemotePluginSDKInstance from './sdk';
import RemotePluginSocketInstance from './socket';
import { jsonConfig } from '#/utils/external-config';

@sealed
class RemotePlugin {
  public readonly auth = RemotePluginAuthInstance;
  public readonly sdk = RemotePluginSDKInstance;
  public readonly socket = RemotePluginSocketInstance;
}

export const remote = new RemotePlugin();

/**
 * Installs the remote plugin into the Vue instance to enable the usage of
 * $remote to access all the tools for handling a Jellyfin server connection.
 */
export function createPlugin(): {
  install: (app: App) => Promise<void>;
} {
  return {
    install: async (app: App): Promise<void> => {
      /**
       * `remote` is readonly but this is the one place it should actually be set
       */
      (app.config.globalProperties.$remote as typeof remote)
        = remote;

      const auth = remote.auth;
      const defaultServers = jsonConfig.defaultServerURLs;
      /**
       * We reverse the list so the first server is the last to be connected,
       * and thus is the chosen one by default
       */
      const missingServers = defaultServers
        .filter((serverUrl) => {
          const server = auth.servers.value.find(
            lsServer => lsServer.PublicAddress === serverUrl
          );

          return isNil(server);
        }).reverse();

      for (const serverUrl of missingServers) {
        await auth.connectServer(serverUrl, true);
      }
    }
  };
}
