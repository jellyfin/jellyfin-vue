/**
 * Utility for converting time between ticks and milliseconds
 */
import {
  format,
  formatDuration,
  formatRelative,
  intervalToDuration
} from 'date-fns';
import * as datefnslocales from 'date-fns/locale';
import { sumBy, merge } from 'lodash-es';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { computed, ComputedRef, isRef, Ref } from 'vue';
import { MaybeRef } from '@vueuse/core';
import { usei18n } from '@/composables';

/**
 * Get dateFns locale
 */
function getDateFnsLocale(locale: string): Locale | undefined {
  //@ts-expect-error - Some of our locales are not present in datefns.
  return datefnslocales[locale];
}

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

  return Math.round(ticks / 10_000);
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
  return formatTime(ticksToMs(ticks));
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
 * Returns the end time of an item
 *
 * @param ticks - Ticks of the item to calculate
 * @returns The resulting string
 */
export function getEndsAtTime(ticks: MaybeRef<number>): ComputedRef<string> {
  return computed(() => {
    ticks = isRef(ticks) ? ticks.value : ticks;

    const i18n = usei18n();
    const ms = ticksToMs(ticks);

    const form = format(Date.now() + ms, 'p', {
      locale: getDateFnsLocale(i18n.locale.value)
    });

    // TODO: Use a Date object
    return i18n.t('endsAt', {
      time: form
    });
  });
}

/**
 * Returns the duration of an item in the following format: X hours Y minutes
 *
 * @param ticks - Ticks of the item to calculate
 * @returns The resulting string
 */
export function getRuntimeTime(ticks: MaybeRef<number>): ComputedRef<string> {
  return computed(() => {
    ticks = isRef(ticks) ? ticks.value : ticks;

    const ms = ticksToMs(ticks);
    const i18n = usei18n();

    return formatDuration(intervalToDuration({ start: 0, end: ms }), {
      format: ['hours', 'minutes'],
      locale: getDateFnsLocale(i18n.locale.value)
    });
  });
}

/**
 * Calculates the end time of an array of BaseItemDto.
 *
 * @param items - Array with the items to calculate.
 * @returns The resulting string
 */
export function getTotalEndsAtTime(
  items: Ref<BaseItemDto[]>
): ComputedRef<string> {
  return computed(() => {
    const ticks = sumBy(items.value, 'RunTimeTicks');

    return getEndsAtTime(ticks).value;
  });
}

/**
 * Invokes datefns format function with locale reactivity
 */
export function dateFnsFormat(
  ...args: Parameters<typeof format>
): ComputedRef<string> {
  return computed(() => {
    const i18n = usei18n();

    args[args.length - 1] = merge(args, {
      locale: getDateFnsLocale(i18n.locale.value)
    });

    return format(...args);
  });
}

/**
 * Invokes datefns formatRelative function with locale reactivity
 */
export function dateFnsFormatRelative(
  ...args: Parameters<typeof formatRelative>
): ComputedRef<string> {
  return computed(() => {
    const i18n = usei18n();

    args[args.length - 1] = merge(args, {
      locale: getDateFnsLocale(i18n.locale.value)
    });

    return formatRelative(...args);
  });
}
