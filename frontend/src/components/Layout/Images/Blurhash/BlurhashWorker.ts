import { decode } from 'blurhash';
import { expose } from 'comlink';
import { sealed } from '@/utils/validation';

/**
 * By default, 20x20 pixels with a punch of 1 is returned.
 * Although the default values recommended by Blurhash developers is 32x32,
 * a size of 20x20 seems to be the sweet spot for us, improving the performance
 * and reducing the memory usage, while retaining almost full blur quality.
 * Lower values had more visible pixelation
 */
export const DEFAULT_WIDTH = 20;
export const DEFAULT_HEIGHT = 20;
export const DEFAULT_PUNCH = 1;

@sealed
class BlurhashWorker {
  private readonly _cache = new Map<string, Uint8ClampedArray>();
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
    width: number = DEFAULT_WIDTH,
    height: number = DEFAULT_HEIGHT,
    punch: number = DEFAULT_PUNCH
  ): Uint8ClampedArray => {
    try {
      const params = [hash, width, height, punch].toString();
      let canvas = this._cache.get(params);

      if (!canvas) {
        canvas = decode(hash, width, height, punch);
        this._cache.set(params, canvas);
      }

      return canvas;
    } catch {
      throw new TypeError(`Blurhash ${hash} is not valid`);
    }
  };

  /**
   * Clear the blurhashes cache
   */
  public readonly clearCache = (): void => {
    this._cache.clear();
  };
}

const instance = new BlurhashWorker();
export default instance;

expose(instance);
