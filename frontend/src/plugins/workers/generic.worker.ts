/// <reference lib="WebWorker" />

import { expose } from 'comlink';
import { sealed } from '@jellyfin-vue/shared/validation';
import { parseVttFile } from './generic/subtitles';

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
      // eslint-disable-next-line sonarjs/pseudo-random
      const j = Math.floor(Math.random() * (i + 1));

      [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
  };

  /**
   * Functions for parsing subtitles
   */
  public parseVttFile = parseVttFile;
}

const instance = new GenericWorker();
export default instance;
export type IGenericWorker = typeof instance;

expose(instance);
