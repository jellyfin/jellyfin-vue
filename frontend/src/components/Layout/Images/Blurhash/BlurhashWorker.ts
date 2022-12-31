import { decode } from 'blurhash';
import { expose } from 'comlink';

const cache = new WeakMap<Parameters<typeof getPixels>, Uint8ClampedArray>();

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
    let canvas = cache.get([hash, width, height, punch]);

    if (!canvas) {
      canvas = decode(hash, width, height, punch);
      cache.set([hash, width, height, punch], canvas);
    }

    return canvas;
  } catch {
    throw new TypeError(`Blurhash ${hash} is not valid`);
  }
}

expose(getPixels);
