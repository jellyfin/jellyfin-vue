import { Plugin } from '@nuxt/types';
import isNil from 'lodash/isNil';
import { authStore, ServerInfo } from '~/store';
import { parseServerListString } from '~/utils/servers';

const appInit: Plugin = () => {
  const auth = authStore();

  /**
   * Initializes Axios and the websocket with the current data in the store
   */
  auth.authInit();

  /**
   * Logout the user on app initialization if the user doesn't want to be remembered.
   *
   * The logic to handle logouts and user switches during runtime lives inside Pinia watchers (~/plugins/store/watchers/auth)
   * Middleware lives at ~/middleware/auth
   */
  if (!auth.rememberMe) {
    auth.logoutUser();
  }

  /**
   * Add default servers from environment variables
   */
  const defaultServers = parseServerListString(process.env.server_url_list);
  const missingServers = defaultServers.filter((serverUrl) => {
    const server = auth.servers.find(
      (lsServer: ServerInfo) => lsServer.PublicAddress === serverUrl
    );

    return !isNil(server);
  });

  for (const serverUrl of missingServers) {
    auth.connectServer(serverUrl, true);
  }
};

export default appInit;
