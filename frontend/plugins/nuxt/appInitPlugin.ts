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

    if (server) fullInfoServers.push(server);

    return !server;
  });

  const promises = [];

  for (const serverUrl of missingServers) {
    // Use Then and Catch only to be able to perform parallel calls (for loading speed reasons)
    const promise = new Promise((resolve, _reject) => {
      // Use a Systemapi instance only because otherwise the same baseUrl
      // would be used during parallel calls
      // eslint-disable-next-line promise/catch-or-return
      new SystemApi(undefined, serverUrl, undefined)
        .getPublicSystemInfo()
        // eslint-disable-next-line promise/prefer-await-to-then
        .then((info) => {
          fullInfoServers.push({
            address: serverUrl,
            publicInfo: info.data
          });

          resolve(null);

          return info;
        })
        // eslint-disable-next-line promise/prefer-await-to-then
        .catch((_err) => {
          console.warn('[Default Servers] Unreachable server: ', serverUrl);

          resolve(null);
        });
    });

    promises.push(promise);
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

    if (missingServers.includes(defaultServer.address)) {
      context.store.commit('servers/SET_SERVER_USED', {
        ...defaultServer,
        isDefault: true
      });
    }

    context.$axios.setBaseURL(defaultServer.address);
  }
};

export default appInitPlugin;
