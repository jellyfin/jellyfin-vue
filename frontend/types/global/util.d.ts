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
 * Gets the last item of a tuple
 */
type Tail<L> = L extends readonly [] ? L : L extends readonly [unknown?, ...infer LTail] ? LTail : L;

/**
 * Sets a type as nullish
 */
type Nullish<T> = T | null | undefined;
