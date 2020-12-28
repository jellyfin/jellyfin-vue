import { decode } from 'blurhash';

/**
 * Decodes blurhash outside the main thread, in a web worker
 *
 * @param {string} hash - Hash to decode.
 * @param {number} width - Width of the decoded pixel array
 * @param {height} height - Height of the decoded pixel array
 * @returns {Uint8ClampedArray} - Returns the decoded pixels in the proxied response by Comlink
 */
export default function getPixels(
  hash: string,
  width: number,
  height: number
): Uint8ClampedArray {
  try {
    return decode(hash, width, height);
  } catch {
    throw new TypeError(`Blurhash ${hash} is not valid`);
  }
}
