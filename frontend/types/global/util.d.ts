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
 * Make all the properties of a type mutable.
 */
type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

/**
 * Omits an specific element from a tuple.
 */
type ExcludeFromTuple<T, K extends number, I extends unknown[] = []> = T extends [infer F, ...infer R]
  ? I['length'] extends K
    ? [...ExcludeFromTuple<R, K, [F, ...I]>]
    : [F, ...ExcludeFromTuple<R, K, [F, ...I]>]
  : [];

/**
 * Sets a type as nullish
 */
type Nullish<T> = T | null | undefined;
