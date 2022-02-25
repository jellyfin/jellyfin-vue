import { SystemApi } from '@jellyfin/client-axios';
import { Plugin } from '@nuxt/types';
import { ServerInfo } from '~/store/servers';
import { parseServerListString } from '~/utils/servers';

const appInitPlugin: Plugin = async (context) => {
  const defaultServers = parseServerListString(process.env.server_url_list);

  const { serverUsed, serverList } = context.store.state.servers;

  const fullInfoServers: ServerInfo[] = [];

  const missingServers = defaultServers.filter((serverUrl) => {
    const server = serverList.find(
      (lsServer: ServerInfo) => lsServer.address === serverUrl
    );

    if (server) {
      fullInfoServers.push(server);
    }

    return !server;
  });

  const promises = [];

  for (const serverUrl of missingServers) {
    // Use a Systemapi instance only because otherwise the same baseUrl
    // would be used during parallel calls
    // eslint-disable-next-line promise/catch-or-return
    promises.push(callSystemApi(serverUrl, fullInfoServers));
  }

  await Promise.all(promises);

  fullInfoServers.forEach((server) => {
    if (missingServers.includes(server.address)) {
      context.store.commit('servers/ADD_SERVER', {
        ...server,
        isDefault: true
      });
    }
  });

  if (serverUsed && serverUsed.address) {
    context.$axios.setBaseURL(serverUsed.address);
  } else if (fullInfoServers.length > 0) {
    const defaultServer = fullInfoServers[0];

    if (
      missingServers.includes(defaultServer.address) &&
      fullInfoServers.length === 1
    ) {
      context.store.commit('servers/SET_SERVER_USED', {
        ...defaultServer,
        isDefault: true
      });
    }

    context.$axios.setBaseURL(defaultServer.address);
  }
};

/**
 * Call System Api
 *
 * Call to get the server's public info, and adds to the FullLinfoServers list
 *
 * @param {string} url URL of the server whose publicinfo wants to get
 * @param {object} fullInfoServers Array of ServerInfo. The push () of the new server is performed inside it
 */
async function callSystemApi(
  url: string,
  fullInfoServers: ServerInfo[]
): Promise<void> {
  const publicInfo = (
    await new SystemApi(undefined, url, undefined).getPublicSystemInfo()
  ).data;

  fullInfoServers.push({
    address: url,
    publicInfo
  });
}

export default appInitPlugin;
