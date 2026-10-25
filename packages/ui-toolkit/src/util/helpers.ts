/**
 * Clamps a number between a given range.
 */
export function clamp(value: number | undefined, min: number, max: number) {
  return Math.min(Math.max(value ?? 0, min), max);
}

/**
 * Converts a given number or string to a pixel value.
 */
export function toPx(value: number | string) {
  return `${value}px`;
}

/**
 * Converts a pixel value (like the lengths returned by getComputedStyle) to a number.
 * Values in other units or that aren't numeric (like 'normal') are 0.
 */
export function fromPx(value: string) {
  return Number(value.replace('px', '')) || 0;
}
