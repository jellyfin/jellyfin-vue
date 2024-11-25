import { useStorage, type RemovableRef } from '@vueuse/core';
import { reactive, toValue } from 'vue';
import { mergeExcludingUnknown } from '@/utils/data-manipulation';
import { isNil } from '@/utils/validation';

export type Persistence = 'localStorage' | 'sessionStorage';

export abstract class CommonStore<T extends object> {
  protected readonly _storeKey: string;
  private readonly _defaultState: () => T;
  private readonly _internalState: T | RemovableRef<T>;

  protected get _state(): T {
    return toValue(this._internalState);
  }

  protected readonly _reset = (): void => {
    Object.assign(this._state, this._defaultState());
  };

  protected constructor(storeKey: string, defaultState: () => T, persistence?: Persistence) {
    this._storeKey = storeKey;
    this._defaultState = defaultState;

    let storage;

    if (persistence === 'localStorage') {
      storage = globalThis.localStorage;
    } else if (persistence === 'sessionStorage') {
      storage = globalThis.sessionStorage;
    }

    this._internalState = isNil(storage)
      ? reactive(this._defaultState()) as T
      : useStorage(storeKey, this._defaultState(), storage, {
        mergeDefaults: (storageValue, defaults) =>
          mergeExcludingUnknown(storageValue, defaults)
      });
  }
}
