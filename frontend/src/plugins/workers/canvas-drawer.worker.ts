/// <reference lib="WebWorker" />

import { expose } from 'comlink';
import { sealed } from '@jellyfin-vue/shared/validation';

/**
 * Draws canvases offscreen
 */
@sealed
class CanvasDrawer {
  /**
   * Draws a transferred canvas from the main thread
   *
   * @param canvas - Canvas to draw the decoded pixels. Must come from main thread's canvas.transferControlToOffscreen()
   * @param width - Width of the target imageData
   * @param height - Height of the target imageData
   */
  public readonly drawBlurhash = ({
    canvas, pixels, width, height
  }: { canvas: OffscreenCanvas; pixels: Uint8ClampedArray; width: number; height: number }) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx!.createImageData(width, height);

    imageData.data.set(pixels);
    ctx!.putImageData(imageData, 0, 0);
  };
}

const instance = new CanvasDrawer();
export default instance;
export type ICanvasDrawer = typeof instance;

expose(instance);
