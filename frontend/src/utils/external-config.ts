import { isArray, isBool, isObj, isStr } from '@/utils/validation';

interface ExternalJSONConfig {
  defaultServerURLs: string[];
  allowServerSelection: boolean;
  routerMode: 'hash' | 'history';
}

/**
 * Asserts that the config parameter is a valid configuration shape
 */
function validateJsonConfig(
  config: unknown
): asserts config is ExternalJSONConfig {
  if (!isObj(config)) {
    throw new Error('Expected not null or defined config');
  }

  if (
    !('defaultServerURLs' in config)
    || !isArray(config.defaultServerURLs)
  ) {
    throw new Error('Expected defaultServerURLS array');
  }

  if (
    config.defaultServerURLs.some(
      defaultServerURL => !isStr(defaultServerURL)
    )
  ) {
    throw new Error('Expected defaultServerURLs to be a list of strings');
  }

  if (!('allowServerSelection' in config) || !isBool(config.allowServerSelection)) {
    throw new Error('Expected allowServerSelection to be boolean');
  }

  if (
    !('routerMode' in config)
    || !isStr(config.routerMode)
    || !['hash', 'history'].includes(config.routerMode)
  ) {
    throw new Error('Expected router mode to be either hash or history');
  }
}

/**
 * Fetch configuration at runtime from the config.json file
 */
async function getJSONConfig(): Promise<ExternalJSONConfig> {
  const loadedConfig: unknown = await (
    await fetch('config.json', { cache: 'no-store' })
  ).json();

  validateJsonConfig(loadedConfig);

  return loadedConfig;
}

export default await getJSONConfig();
