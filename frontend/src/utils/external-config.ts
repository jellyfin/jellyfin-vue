import destr from 'destr';
import { isNil } from 'lodash-es';

interface ExternalJSONConfig {
  defaultServerURLs: Array<string>;
  historyMode: 'hash' | 'history';
}

let externalConfig: ExternalJSONConfig | undefined;

/**
 * Fetch configuration at runtime from the config.json file
 * We use destr for serialization as it has better support for JS primitives.
 */
export async function getJSONConfig(): Promise<ExternalJSONConfig> {
  if (isNil(externalConfig)) {
    externalConfig = destr(
      JSON.stringify(await (await fetch('./config.json')).json())
    ) as ExternalJSONConfig;
  }

  return externalConfig;
}
