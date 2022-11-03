/**
 * Utility for converting time between ticks and milliseconds
 */
import { intervalToDuration } from 'date-fns';
import sumBy from 'lodash/sumBy';
import { BaseItemDto } from '@jellyfin/client-axios';

/**
 * Converts .NET ticks to milliseconds
 *
 * @param ticks - Number of .NET ticks to convert
 * @returns The converted value in milliseconds
 */
export function ticksToMs(ticks: number | null | undefined): number {
  if (!ticks) {
    ticks = 0;
  }

  return Math.round(ticks / 10000);
}

/**
 * Converts milliseconds to .NET ticks
 *
 * @param ms - Number of milliseconds to convert
 * @returns The converted value in .NET ticks
 */
export function msToTicks(ms: number): number {
  return Math.round(ms * 10000);
}

/**
 *
 */
export function formatTime(seconds: number): string {
  let minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  minutes = minutes - hours * 60;
  seconds = Math.floor(seconds - (minutes * 60 + hours * 60 * 60));

  /**
   * Formats Time
   * E.g. 7 -> 07
   *
   * @param number - Number to format
   * @returns Formated seconds number
   */
  function formatDigits(number: number): string {
    return ('0' + number).slice(-2);
  }

  if (hours) {
    return `${hours}:${formatDigits(minutes)}:${formatDigits(seconds)}`;
  } else {
    return `${minutes}:${formatDigits(seconds)}`;
  }
}

/**
 * Returns the end time of an item
 *
 * @param ticks - Ticks of the item to calculate
 * @returns The resulting string
 */
export function getEndsAtTime(ticks: number): string {
  const ms = ticksToMs(ticks);

  const format = window.$nuxt.$dateFns.format(Date.now() + ms, 'p', {
    locale: window.$nuxt.$i18n.locale
  });

  // TODO: Use a Date object
  return window.$nuxt.$t('endsAt', {
    time: format
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

  return window.$nuxt.$dateFns.formatDuration(
    intervalToDuration({ start: 0, end: ms }),
    {
      format: ['hours', 'minutes'],
      locale: window.$nuxt.$i18n.locale
    }
  );
}
/**
 * Calculates the end time of an array of BaseItemDto.
 *
 * @param items - Array with the items to calculate.
 * @returns The resulting string
 */
export function getTotalEndsAtTime(items: BaseItemDto[]): string {
  const ticks = sumBy(items, 'RunTimeTicks');

  return getEndsAtTime(ticks);
}
