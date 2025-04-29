/**
 * Utility for converting time between ticks and milliseconds
 */
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import {
  addMilliseconds,
  format,
  formatDuration,
  intervalToDuration
} from 'date-fns';
import i18next from 'i18next';
import { now } from '#/store';
import { useDateFns } from '#/composables/use-datefns';

/**
 * Formats Time
 * E.g. 7 -> 07
 *
 * @param number - Number to format
 * @returns Formated seconds number
 */
function formatDigits(number: number): string {
  return `0${number}`.slice(-2);
}

/**
 * Converts .NET ticks to milliseconds
 *
 * @param ticks - Number of .NET ticks to convert
 * @returns The converted value in milliseconds
 */
export function ticksToMs(ticks: number | null | undefined): number {
  return ticks ? Math.round(ticks / 10_000) : 0;
}

/**
 * Converts milliseconds to .NET ticks
 *
 * @param ms - Number of milliseconds to convert
 * @returns The converted value in .NET ticks
 */
export function msToTicks(ms: number): number {
  return Math.round(ms * 10_000);
}

/**
 * Format time in the HH:MM:SS format
 * @param ticks - Ticks to format
 */
export function formatTicks(ticks: number): string {
  return formatTime(ticksToMs(ticks) / 1000);
}

/**
 * Format time in the HH:MM:SS format
 * @param seconds - Seconds to format
 */
export function formatTime(seconds: number): string {
  let minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  minutes = minutes - hours * 60;
  seconds = Math.floor(seconds - (minutes * 60 + hours * 60 * 60));

  return hours
    ? `${hours}:${formatDigits(minutes)}:${formatDigits(seconds)}`
    : `${minutes}:${formatDigits(seconds)}`;
}

/**
 * Returns the end date of an item
 * @param ticks - Ticks of the item to calculate
 * @returns The resulting date object
 */
function getEndsAtDate(ticks: number): Date {
  return addMilliseconds(now.value, ticksToMs(ticks));
}

/**
 * Returns the end time of an item as an string.
 * Changes in real time BUT MUST BE USED INSIDE A TEMPLATE
 *
 * @param ticks - Ticks of the item to calculate
 * @returns The resulting string
 */
export function getEndsAtTime(ticks: number): string {
  const endDate = getEndsAtDate(ticks);
  const form = useDateFns(format, endDate, 'p');

  return i18next.t('endsAt', {
    time: form
  });
}

/**
 * Returns the duration of an item in the following format: X hours Y minutes
 *
 * @param ticks - Ticks of the item to calculate
 * @returns The resulting string
 */
export function getRuntimeTime(ticks: number): string {
  const ms = ticksToMs(ticks);

  return useDateFns(
    formatDuration,
    intervalToDuration({ start: 0, end: ms }),
    {
      format: ['hours', 'minutes']
    }
  );
}

/**
 * Calculates the end time of an array of BaseItemDto.
 *
 * @param items - Array with the items to calculate.
 * @returns The resulting string
 */
export function getTotalEndsAtTime(
  items: BaseItemDto[]
): string {
  const aggregatedTicks = items.reduce((acc, item) => acc + (item.RunTimeTicks ?? 0), 0);

  return getEndsAtTime(aggregatedTicks);
}
