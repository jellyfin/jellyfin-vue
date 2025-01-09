/// <reference lib="WebWorker" />

import { decode } from 'blurhash';
import { expose } from 'comlink';
import { sealed } from '@jellyfin-vue/shared/validation';

/**
 * Decodes blurhash strings into pixels
 */
@sealed
class BlurhashDecoder {
  private readonly _pixelsCache = new Map<string, Uint8ClampedArray>();

  /**
   * Decodes blurhash outside the main thread, in a web worker.
   *
   * @param hash - Hash to decode.
   * @param width - Width of the decoded pixel array
   * @param height - Height of the decoded pixel array.
   * @param punch - Contrast of the decoded pixels
   * @returns - Returns the decoded pixels in the proxied response by Comlink
   */
  public readonly getPixels = (
    hash: string,
    width: number,
    height: number,
    punch: number
  ): Uint8ClampedArray => {
    try {
      const params = String([hash, width, height, punch]);
      let pixels = this._pixelsCache.get(params);

      if (!pixels) {
        pixels = decode(hash, width, height, punch);
        this._pixelsCache.set(params, pixels);
      }

      return pixels;
    } catch {
      throw new TypeError(`Blurhash ${hash} is not valid`);
    }
  };

  /**
   * Clear the blurhashes cache
   */
  public readonly clearCache = (): void => {
    this._pixelsCache.clear();
  };
}

const instance = new BlurhashDecoder();
export default instance;
export type IBlurhashDecoder = typeof instance;

expose(instance);
