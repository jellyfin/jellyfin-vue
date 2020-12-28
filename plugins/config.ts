import config from '~/config.json';

/**
 * @returns {string} default server url
 */
function getServerUrl(): string {
  return config.server.url;
}

/**
 * @returns {string} default server base url
 */
function getBaseUrl(): string {
  return config.server.baseUrl;
}

/**
 * @returns {number} default server port
 */
function getServerPort(): number {
  return config.server.port;
}

/**
 * @returns {boolean} default server ssl status
 */
function getServerSsl(): boolean {
  return config.server.ssl;
}

/**
 * @returns {string} default full server url
 */
export default function getFullServerUrl(): string {
  const protocol = getServerSsl() ? 'https' : 'http';
  return `${protocol}://${getServerUrl()}:${getServerPort()}/${getBaseUrl()}`;
}
