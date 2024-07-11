import { expose } from 'comlink';
import { shuffle as _shuffle } from 'lodash-es';
import { sealed } from '@/utils/validation';

/**
 * All functions that could take some time to complete and block the main thread
 * must be offloaded to this worker
 */
@sealed
class GenericWorker {
  public readonly shuffle = (...args: Parameters<typeof _shuffle>) => _shuffle(...args);
}

const instance = new GenericWorker();
export default instance;
export type IGenericWorker = typeof instance;

expose(instance);
