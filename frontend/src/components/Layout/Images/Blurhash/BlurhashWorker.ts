import { decode } from 'blurhash';
import { expose } from 'comlink';

/**
 * Decodes blurhash outside the main thread, in a web worker
 *
 * @param hash - Hash to decode.
 * @param width - Width of the decoded pixel array
 * @param height - Height of the decoded pixel array.
 * @param punch - Contrast of the decoded pixels
 * @returns - Returns the decoded pixels in the proxied response by Comlink
 */
export default function getPixels(
  hash: string,
  width: number,
  height: number,
  punch: number
): Uint8ClampedArray {
  try {
    return decode(hash, width, height, punch);
  } catch {
    throw new TypeError(`Blurhash ${hash} is not valid`);
  }
}

expose(getPixels);
