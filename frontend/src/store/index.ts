import { useMediaControls, useMediaQuery, useNetwork, useNow, useScroll ,type RemovableRef, useStorage } from '@vueuse/core';
import { isRef, reactive, shallowRef, toValue, watch } from 'vue';
import { mergeExcludingUnknown } from '@/utils/data-manipulation';
import { isNil } from '@/utils/validation';
/**
 * This file contains global variables (specially VueUse refs) that are used multiple times across the client.
 * VueUse composables will set new event handlers, so it's more
 * efficient to reuse those, both in components and TS files.
 */

/**
 * Reactive Date.now() instance
 */
export const now = useNow();
/**
 * Reactive window scroll
 */
export const windowScroll = useScroll(window);
/**
 * Ref to the local media player
 */
export const mediaElementRef = shallowRef<HTMLMediaElement>();
/**
 * Reactive media controls of the local media player
 */
export const mediaControls = useMediaControls(mediaElementRef);
/**
 * WebAudio instance of the local media player
 */
export const mediaWebAudio = {
  context: new AudioContext(),
  sourceNode: undefined as undefined | MediaElementAudioSourceNode
};
/**
 * Reactively tracks if the user wants animations (false) or not (true).
 */
export const prefersNoMotion = useMediaQuery('(prefers-reduced-motion)');
/**
 * Reactively tracks if the device has a high precision input (like a mouse)
 */
export const isFinePointer = useMediaQuery('(pointer:fine)');
/**
 * Reactively tracks if the user is connected to the internet
 */
export const network = useNetwork();

type Persistence = 'localStorage' | 'sessionStorage';

export abstract class CommonStore<T extends object> {
  protected _storeKey: string;
  private _defaultState: T;
  private _internalState: T | RemovableRef<T>;

  protected get _state(): T {
    return isRef(this._internalState) ? this._internalState.value : this._internalState;
  }

  protected readonly _reset = (): void => {
    Object.assign(this._state, this._defaultState);
  };

  protected constructor(storeKey: string, defaultState: T, persistence?: Persistence) {
    this._storeKey = storeKey;
    this._defaultState = defaultState;

    let storage;

    if (persistence === 'localStorage') {
      storage = window.localStorage;
    } else if (persistence === 'sessionStorage') {
      storage = sessionStorage;
    }

    this._internalState = isNil(storage) ? reactive(structuredClone(defaultState)) as T :
      useStorage(storeKey, structuredClone(defaultState), storage, {
        mergeDefaults: (storageValue, defaults) =>
          mergeExcludingUnknown(storageValue, defaults)
      });
  }
}

export abstract class SyncedStore<T extends object> extends CommonStore<T> {
  /**
   * This store syncs the state of the parent store with the remote server.
   *
   * @param keys - The keys to be synced with the server. If not provided, all keys will be synced
   */
  protected constructor(storeKey: string, defaultState: T, persistence?: Persistence, keys?: Array<keyof T>) {
    super(storeKey, defaultState, persistence);

    if (keys) {
      for (const key of keys) {
        watch(() => this._state[key], () => {
          console.log(`${String(key)} changed`);
        });
      }
    } else {
      watch(this._state, () => {
        console.log('whole state changed');
      });
    }
  }
}
