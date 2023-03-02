/**
 * Validator to which enforces that a select component has at least one value selected
 */
export const SomeItemSelectedRule = [
  (v: unknown[]): boolean | string => v.length > 0
];
