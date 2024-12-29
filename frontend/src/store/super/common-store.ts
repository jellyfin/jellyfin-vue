/**
 * CommonStore is a base class for all stores. It extends from BaseState,
 * providing also a way to reset the state on logout automatically.
 *
 * This class is intended to be used by stores. It
 * should not be used by plugins (check BaseState for that)
 * since it has a dependency on the auth plugin.
 */
import type { UnknownRecord } from 'type-fest';
import { isBool } from '@jellyfin-vue/shared/validation';
import { remote } from '#/plugins/remote';
import { BaseState, type BaseStateParams } from '#/store/super/base-state';

export interface CommonStoreParams<T> extends BaseStateParams<T> {
  resetOnLogout?: boolean | MaybePromise<T>;
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
> extends BaseState<T, K> {
  protected constructor({
    defaultState,
    storeKey,
    persistenceType,
    resetOnLogout
  }: CommonStoreParams<T>
  ) {
    super({ defaultState, storeKey, persistenceType });

    if (resetOnLogout) {
      remote.auth.onAfterLogout(isBool(resetOnLogout) ? this._reset : resetOnLogout);
    }
  }
}
