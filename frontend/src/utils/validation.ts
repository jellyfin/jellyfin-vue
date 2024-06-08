import type { AxiosError } from 'axios';

/**
 * Validator to which enforces that a select component has at least one value selected
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
export function isStr(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Check if the given value is a funcion
 */
export function isFunc<T extends (...args: unknown[]) => unknown>(value: unknown): value is T {
  return typeof value === 'function';
}

/**
 * Check if the value is undefined
 */
export function isUndef(value: unknown): value is undefined {
  return value === undefined;
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
  return isNull(value) || isUndef(value);
}

/**
 * Check if the value is an object.
 */
export function isObj(value: unknown): value is object {
  return typeof value === 'object' && !isNull(value);
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
export function isArray(object: unknown): object is unknown[] {
  return Array.isArray(object);
}

/**
 * Seals a class
 *
 * @type TypeScript Decorator
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function sealed(constructor: Function): void {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}
