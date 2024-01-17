import type { AxiosError } from 'axios';

/**
 * Validator to which enforces that a select component has at least one value selected
 */
export const SomeItemSelectedRule = [
  (v: unknown[]): boolean | string => v.length > 0
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
 * TypeScript type guard for AxiosError
 */
export function isAxiosError(object: unknown): object is AxiosError {
  return !!(object && typeof object === 'object' && 'isAxiosError' in object);
}

/**
 * Guard for undefined values
 */
export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

/**
 * Guard for null values
 */
export function isNull(value: unknown): value is null {
  return value === null;
}

/**
 * Guard for null or undefined values
 */
export function isNil(value: unknown): value is null | undefined {
  return isNull(value) || isUndefined(value);
}
