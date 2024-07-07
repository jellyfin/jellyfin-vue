import { isArray, isBool, isNil, isObj, isStr } from '@/utils/validation';

interface ExternalJSONConfig {
  defaultServerURLs: string[];
  allowServerSelection: boolean;
  routerMode: 'hash' | 'history';
}

let externalConfig: ExternalJSONConfig | undefined;

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
 * Get the base path for the application
 */
function getBasePath(): string {
  const base = import.meta.env.BASE_URL;
  if (base.endsWith('/')) {
    return base.substring(0, base.length - 1);
  }

  return base;
}

/**
 * Fetch configuration at runtime from the config.json file
 * We use destr for serialization as it has better support for JS primitives.
 */
export async function getJSONConfig(): Promise<ExternalJSONConfig> {
  if (isNil(externalConfig)) {
    const basePath = getBasePath();
    const loadedConfig: unknown = await (
      await fetch(basePath + '/config.json', { cache: 'no-store' })
    ).json();

    validateJsonConfig(loadedConfig);

    externalConfig = loadedConfig;
  }

  return externalConfig;
}
