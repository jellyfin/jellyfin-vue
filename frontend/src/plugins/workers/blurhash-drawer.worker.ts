/// <reference lib="WebWorker" />

import { decode } from 'blurhash';
import { expose } from 'comlink';
import { sealed } from '@jellyfin-vue/shared/validation';

/**
 * Decodes blurhash strings into pixels and draws the results into offscreen canvases
 */
@sealed
class BlurhashDrawer {
  private readonly _pixelsCache = new Map<string, Uint8ClampedArray>();

  /**
   * Get the pixel array from the blurhash string, caching it for reuse
   * if same params are provided
   *
   * @param hash - Hash to decode.
   * @param width - Width of the decoded pixel array
   * @param height - Height of the decoded pixel array.
   * @param punch - Contrast of the decoded pixels
   * @returns - Returns the decoded pixels in the proxied response by Comlink
   */
  private readonly _getPixels = (
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
   * Draws a transferred canvas from the main thread
   *
   * @param canvas - Canvas to draw the decoded pixels. Must come from main thread's canvas.transferControlToOffscreen()
   * @param width - Width of the target imageData
   * @param height - Height of the target imageData
   */
  private readonly _drawCanvas = (
    canvas: OffscreenCanvas,
    pixels: Uint8ClampedArray,
    width: number,
    height: number
  ) => {
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

  public readonly draw = ({
    canvas, hash, width, height, punch
  }: { canvas: OffscreenCanvas; hash: string; width: number; height: number; punch: number }) => {
    const pixels = this._getPixels(hash, width, height, punch);

    this._drawCanvas(canvas, pixels, width, height);
  };
}

const instance = new BlurhashDrawer();
export default instance;
export type IBlurhashDrawer = typeof instance;

expose(instance);
