import { wrap } from 'comlink';
import { watch } from 'vue';
import type { IBlurhashDecoder } from './blurhash-decoder.worker';
import BlurhashDecoder from './blurhash-decoder.worker?worker';
import type { ICanvasDrawer } from './canvas-drawer.worker';
import CanvasDrawer from './canvas-drawer.worker?worker';
import type { IGenericWorker } from './generic.worker';
import GenericWorker from './generic.worker?worker';
import { remote } from '@/plugins/remote';

/**
 * A worker for decoding blurhash strings into pixels
 */
export const blurhashDecoder = wrap<IBlurhashDecoder>(new BlurhashDecoder());

/**
 * A worker for drawing canvas offscreen. The canvas must be transferred like this:
 * ```ts
 * import { transfer } from 'comlink';
 *
 *  await canvasDrawer.drawBlurhash(transfer(
 *      { canvas: offscreen,
 *        pixels,
 *        width,
 *        height
 *      }, [offscreen]));
 * ```
 */
export const canvasDrawer = wrap<ICanvasDrawer>(new CanvasDrawer());

/**
 * A worker for running any non-specific function that could be expensive and take some time to complete,
 * blocking the main thread
 */
export const genericWorker = wrap<IGenericWorker>(new GenericWorker());

/**
 * Clear cached blurhashes on logout
 */
watch(
  () => remote.auth.currentUser,
  async () => {
    if (remote.auth.currentUser === undefined) {
      await blurhashDecoder.clearCache();
    }
  }, { flush: 'post' }
);
