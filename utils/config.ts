import config from '../config';

/**
 * @returns {string} default server url
 */
export function getServerUrl(): string {
  return config.server.url;
}

/**
 * @returns {number} default server port
 */
export function getServerPort(): number {
  return config.server.port;
}

/**
 * @returns {boolean} default server ssl status
 */
export function getServerSsl(): boolean {
  return config.server.ssl;
}

/**
 * @returns {string} default full server url
 */
export function getFullServerUrl(): string {
  const protocol = getServerSsl() ? 'https' : 'http';
  return `${protocol}://${getServerUrl()}:${getServerPort()}`;
}
