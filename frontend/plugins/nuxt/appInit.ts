import { Plugin } from '@nuxt/types';
import { authStore, ServerInfo } from '~/store';
import { parseServerListString } from '~/utils/servers';

const appInit: Plugin = () => {
  const auth = authStore();
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
