/**
 * This class provides the base class functionality for stores that contains
 * reactive state. It provides a default state, a way to reset the state, and
 * persistence options.
 *
 * This class is intended to be used by plugins and other abstract classes. It
 * should not be used by stores (check CommonStore for that).
 */
import { useStorage } from '@vueuse/core';
import { ref, type Ref } from 'vue';
import type { UnknownRecord } from 'type-fest';
import { isNil } from '@jellyfin-vue/shared/validation';
import { mergeExcludingUnknown } from '#/utils/data-manipulation';

export interface BaseStateParams<T> {
  defaultState: () => T;
  /**
   * Key to be used as an identifier
   */
  storeKey: string;
  persistenceType?: 'localStorage' | 'sessionStorage';
}

export abstract class BaseState<
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

  protected readonly _reset = () => {
    this._state.value = this._defaultState();
  };

  protected constructor({
    defaultState,
    storeKey,
    persistenceType
  }: BaseStateParams<T>
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
  }
}
