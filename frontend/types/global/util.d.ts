/**
 * BetterOmit still provides IntelliSense fedback, unlike the built-in Omit type.
 * See https://github.com/microsoft/TypeScript/issues/56135
 */
type BetterOmit<T, K extends keyof never> = T extends Record<never, never>
  ? {
      [P in keyof T as P extends K ? never : P]: T[P]
    }
  : T;

/**
 * Sets a type as nullish
 */
type Nullish<T> = T | null | undefined;

type MaybePromise<T> = (() => Promise<T>) | (() => T);
