import type { AxiosError } from 'axios';
import type { Class } from 'type-fest';
import { isArray, isObject } from '@vue/shared';

/**
 * Validator to which enforces that a select component has at least one value selected
 * @deprecated - Remove/Refactor when @jellyfin-vue/ui-toolkit is completed.
 */
export const SomeItemSelectedRule = [
  (v: unknown[]): boolean | string => v.length !== 0
];

/**
 * Check if the value is a number.
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

/**
 * Check if the value is a boolean.
 */
export function isBool(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Check if the value is a string.
 */
export { isString as isStr } from '@vue/shared';

/**
 * Check if the given value is a funcion
 */
export { isFunction as isFunc } from '@vue/shared';

/**
 * Check if the value is undefined
 */
export function isUndef(value: unknown): value is undefined {
  /**
   * typeof val === 'undefined' will never throw an error, even if the variable is not declared,
   * while val === undefined will.
   * It's also faster than val === undefined and handles better the void operator
   */
  // eslint-disable-next-line unicorn/no-typeof-undefined
  return typeof value === 'undefined';
}

/**
 * Check if the value is null
 */
export function isNull(value: unknown): value is null {
  return value === null;
}

/**
 * Check if the value is null or undefined
 */
export function isNil(value: unknown): value is null | undefined {
  return isUndef(value) || isNull(value);
}

/**
 * Check if the value is an object.
 */
export function isObj(value: unknown): value is object {
  return isObject(value) && !isArray(value);
}

/**
 * TypeScript type guard for AxiosError
 */
export function isAxiosError(object: unknown): object is AxiosError {
  return isObj(object) && 'isAxiosError' in object;
}

/**
 * Check if the value is an array
 */
export { isArray } from '@vue/shared';

/**
 * Seals a class
 *
 * @type TypeScript Decorator
 */
export function sealed(constructor: Class<unknown, unknown[]>): void {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}
