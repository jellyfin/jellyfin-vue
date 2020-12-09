import { decode } from 'blurhash';

/**
 * Decodes blurhash outside the main thread, in a web worker
 *
 * @param {string} hash - Hash to decode.
 * @param {number} width - Width of the decoded pixel array
 * @param {height} height - Height of the decoded pixel array
 * @returns {Promise} Returns the decoded pixels in the proxied response by Comlink
 */
export default async function getPixels(
  hash: string,
  width: number,
  height: number
): Promise<Uint8ClampedArray> {
  try {
    const pixels = await decode(hash, width, height);
    return pixels;
  } catch {
    throw new TypeError('Blurhash' + hash + ' is not valid');
  }
}
