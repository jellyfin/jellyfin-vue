import isNil from 'lodash/isNil';
import { ExternalJSONConfig } from './types';
import { useRemote } from '@/composables';

const response = await fetch('./config.json');
const data = (await response.json()) as ExternalJSONConfig;

/**
 * Parses external configuration file (config.json in public folder)
 */
export default function createJSONConfig(): { install: () => Promise<void> } {
  return {
    install: async (): Promise<void> => {
      const auth = useRemote().auth;
      const defaultServers = data.defaultServerURLs;
      const missingServers = defaultServers.filter((serverUrl) => {
        const server = auth.servers.value.find(
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
