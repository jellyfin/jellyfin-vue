import { useStorage, type RemovableRef } from '@vueuse/core';
import { isRef, reactive } from 'vue';
import { mergeExcludingUnknown } from '@/utils/data-manipulation';
import { isNil } from '@/utils/validation';

export type Persistence = 'localStorage' | 'sessionStorage';

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
