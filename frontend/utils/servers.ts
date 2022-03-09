/**
 * Regex for URL validation
 */
export const urlRegEx = /^https?:\/\/.+/;

/**
 * Parse and returns a list of url strings from DEFAULT_SERVERS env var
 *
 * @param {string | undefined} value Env var DEFAULT_SERVERS value
 * @returns {string[]} list of url strings. (default: empty array)
 */
export function parseServerListString(value: string | undefined): string[] {
  if (!value) return [];

  const serverUrlList: string[] = [];

  const trimmedSplit = value.split(',').map((url) => url.trim());

  // Url Validity Check
  trimmedSplit.forEach((url: string) => {
    if (urlRegEx.test(url)) {
      // Valid Url
      serverUrlList.push(url);
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        `[Default Servers] This url is not valid. It will be excluded from the server list to avoid errors. (${url})`
      );
    }
  });

  return serverUrlList;
}
