import { isNil } from 'lodash-es';

interface ExternalJSONConfig {
  defaultServerURLs: string[];
  routerMode: 'hash' | 'history';
}

let externalConfig: ExternalJSONConfig | undefined;

/**
 * Asserts that the config parameter is a valid configuration shape
 */
function validateJsonConfig(
  config: unknown
): asserts config is ExternalJSONConfig {
  if (typeof config !== 'object' || !config) {
    throw new Error('Expected not null or defined config');
  }

  if (
    !('defaultServerURLs' in config) ||
    !Array.isArray(config.defaultServerURLs)
  ) {
    throw new Error('Expected defaultServerURLS array');
  }

  if (
    config.defaultServerURLs.some(
      (defaultServerURL) => typeof defaultServerURL !== 'string'
    )
  ) {
    throw new Error('Expected defaultServerURLs to be a list of strings');
  }

  if (
    !('routerMode' in config) ||
    typeof config.routerMode !== 'string' ||
    !['hash', 'history'].includes(config.routerMode)
  ) {
    throw new Error('Expected router mode to be either hash or history');
  }
}

/**
 * Fetch configuration at runtime from the config.json file
 * We use destr for serialization as it has better support for JS primitives.
 */
export async function getJSONConfig(): Promise<ExternalJSONConfig> {
  if (isNil(externalConfig)) {
    const loadedConfig = await (await fetch('/config.json')).json();

    validateJsonConfig(loadedConfig);

    externalConfig = loadedConfig;
  }

  return externalConfig;
}
