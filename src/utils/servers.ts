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

  /**
   * Check the URL with the appropriate Regex and if valid, adds it to the list
   *
   * @param {string} url Url string to test and add
   */
  function checkAndAddUrl(url: string): void {
    if (urlRegEx.test(url)) {
      // Valid Url
      serverUrlList.push(url);
    } else {
      console.warn(
        `[Default Servers] This url is not valid. It will be excluded from the server list to avoid errors. (${url})`
      );
    }
  }

  const splitByComma = value.split(',');
  const trimmedSplit = splitByComma.map((url) => url.trim());

  // Url Validity Check
  trimmedSplit.forEach((url) => {
    checkAndAddUrl(url);
  });

  return serverUrlList;
}
