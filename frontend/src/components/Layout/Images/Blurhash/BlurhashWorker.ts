import { decode } from 'blurhash';
import { expose } from 'comlink';

const cache: { [key: string]: Uint8ClampedArray } = {};

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
    const params = [hash, width, height, punch].toString();
    let canvas = cache[params];

    if (!canvas) {
      canvas = decode(hash, width, height, punch);
      cache[params] = canvas;
    }

    return canvas;
  } catch {
    throw new TypeError(`Blurhash ${hash} is not valid`);
  }
}

expose(getPixels);
