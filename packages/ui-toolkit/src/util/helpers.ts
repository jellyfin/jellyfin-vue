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
