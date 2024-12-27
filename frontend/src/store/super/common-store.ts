import { useStorage } from '@vueuse/core';
import { ref, watch, type Ref } from 'vue';
import type { UnknownRecord } from 'type-fest';
import { mergeExcludingUnknown } from '@/utils/data-manipulation';
import { isFunc, isNil } from '@/utils/validation';

export interface CommonStoreParams<T> {
  defaultState: () => T;
  /**
   * Key to be used as an identifier
   */
  storeKey: string;
  persistenceType?: 'localStorage' | 'sessionStorage';
  resetOnLogout?: boolean | (() => void);
}

export abstract class CommonStore<
  T extends object = UnknownRecord,
  /**
   * State properties that should be exposed to consumers
   * of this class. If not provided, all properties
   * will be private.
   * Exposed properties are also writable.
   */
  K extends keyof T = never
> {
  private readonly _defaultState;
  protected readonly _storeKey;
  protected readonly _state: Ref<T>;
  /**
   * Same as _state, but we use the type system to define which properties
   * we want to have accessible to consumers of the extended class.
   */
  public readonly state: Ref<Pick<T, K>>;

  protected readonly _reset = (): void => {
    Object.assign(this._state.value, this._defaultState());
  };

  protected constructor({
    defaultState,
    storeKey,
    persistenceType,
    resetOnLogout
  }: CommonStoreParams<T>
  ) {
    this._storeKey = storeKey;
    this._defaultState = defaultState;

    this._state = isNil(persistenceType) || isNil(storeKey)
      ? ref(this._defaultState()) as Ref<T>
      : useStorage(storeKey, this._defaultState(), globalThis[persistenceType], {
          mergeDefaults: (storageValue, defaults) =>
            mergeExcludingUnknown(storageValue, defaults)
        });
    this.state = this._state;

    if (resetOnLogout) {
      // eslint-disable-next-line sonarjs/no-async-constructor
      void (async () => {
        const { remote } = await import('@/plugins/remote');

        watch(remote.auth.currentUser,
          () => {
            if (!remote.auth.currentUser.value) {
              const funcToRun = isFunc(resetOnLogout) ? resetOnLogout : this._reset;

              funcToRun();
            }
          }, { flush: 'post' }
        );
      })();
    }
  }
}
