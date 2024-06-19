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
    width: number = DEFAULT_WIDTH,
    height: number = DEFAULT_HEIGHT,
    punch: number = DEFAULT_PUNCH
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
   * Draws the transferred canvas from the main thread
   *
   * @param hash - Hash to decode.
   * @param canvas - Canvas to draw the decoded pixels. Must come from main thread's canvas.transferControlToOffscreen()
   * @param width - Width of the decoded pixel array
   * @param height - Height of the decoded pixel array.
   * @param punch - Contrast of the decoded pixels
   */
  public readonly drawCanvas = ({
    hash, canvas, width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT, punch = DEFAULT_PUNCH
  }: { hash: string; canvas: OffscreenCanvas; width: number; height: number; punch: number }) => {
    const pixels = this.getPixels(hash, width, height, punch);
    const ctx = canvas.getContext('2d');
    const imageData = ctx!.createImageData(width, height);
    imageData.data.set(pixels);
    ctx!.putImageData(imageData, 0, 0);
  };

  /**
   * Clear the blurhashes cache
   */
  public readonly clearCache = (): void => {
    this._pixelsCache.clear();
  };
}

const instance = new BlurhashWorker();
export default instance;

expose(instance);
