import { toRaw } from 'vue';
import { releaseProxy, wrap } from 'comlink';
import type { IBlurhashDrawer } from './blurhash-drawer.worker';
import BlurhashDrawer from './blurhash-drawer.worker?worker';
import type { IGenericWorker } from './generic.worker';
import GenericWorker from './generic.worker?worker';
import { remote } from '#/plugins/remote';

/**
 * A worker for decoding blurhash strings and drawing results
 * into offscreen canvases. The canvas must be transferred like this:
 * ```ts
 * import { transfer } from 'comlink';
 *
 *  await blurhashDrawer.draw(transfer(
 *      { canvas,
 *        hash,
 *        width,
 *        height,
 *        punch
 *      }, [offscreen]));
 * ```
 */
export const blurhashDrawer = wrap<IBlurhashDrawer>(new BlurhashDrawer());

remote.auth.onAfterLogout(async () => await blurhashDrawer.clearCache());

/**
 * The generic worker is a class that must implement all functions that could take some time to complete
 * and could potentially block the main thread.
 *
 * With his function, we instantiate the worker, run the function and then cleanup it immediately.
 *
 * The function is also prepared for receiving Vue reactive objects,
 * converting them beforehand.
 */
export function runGenericWorkerFunc<
  T extends keyof IGenericWorker,
  R extends ReturnType<IGenericWorker[T]> = ReturnType<IGenericWorker[T]>
>(key: T) {
  return async (...args: Parameters<IGenericWorker[T]>): Promise<R | undefined> => {
    const workerInstance = new GenericWorker();
    const genericWorker = wrap<IGenericWorker>(workerInstance);

    try {
      /**
       * The `toRaw` function is used as a safeguard in case Vue's reactive values are passed as arguments,
       * since the worker only accepts plain objects.
       */
      // @ts-expect-error - The types here are wrong at Comlink's side
      return await genericWorker[key](...args.map(a => toRaw(a)));
    } catch {
      return undefined;
    } finally {
      genericWorker[releaseProxy]();
      workerInstance.terminate();
    }
  };
}
