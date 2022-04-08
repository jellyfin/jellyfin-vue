import { Context, Plugin } from '@nuxt/types';
import { authStore, ServerInfo } from '~/store';
import { parseServerListString } from '~/utils/servers';
import { setHeaderAndBaseUrl } from '~/middleware/auth';

const appInit: Plugin = (ctx: Context) => {
  const auth = authStore();

  /**
   * Logout the user on app initialization if the user doesn't want to be remembered.
   *
   * The logic to handle logouts and user switches during runtime lives inside Pinia watchers (~/plugins/store/watchers/auth)
   * Middleware lives at ~/middleware/auth
   */
  if (!auth.rememberMe) {
    setHeaderAndBaseUrl(ctx, auth);
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

    return server ? true : false;
  });

  for (const serverUrl of missingServers) {
    auth.connectServer(serverUrl, true);
  }
};

export default appInit;
