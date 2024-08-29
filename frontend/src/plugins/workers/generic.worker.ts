import { expose } from 'comlink';
import { sealed } from '@/utils/validation';

/**
 * All functions that could take some time to complete and block the main thread
 * must be offloaded to this worker
 */
@sealed
class GenericWorker {
  /**
   * Shuffles an array using the Durstenfeld shuffle algorithm, an
   * optimized version of Fisher-Yates shuffle.
   */
  public shuffle<T>(array: T[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));

      [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
  };
}

const instance = new GenericWorker();
export default instance;
export type IGenericWorker = typeof instance;

expose(instance);
