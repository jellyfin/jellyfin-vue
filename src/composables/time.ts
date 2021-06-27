import { format, formatDuration, intervalToDuration } from 'date-fns';
import { useI18n } from 'vue-i18n';

export function useTime() {
  const { locale, t } = useI18n();

  /**
   * Converts .NET ticks to milliseconds
   *
   * @param {(number | null | undefined)} ticks - Number of .NET ticks to convert
   * @returns {number} The converted value in milliseconds
   */
  function ticksToMs(ticks: number | null | undefined): number {
    if (!ticks) {
      ticks = 0;
    }

    return Math.round(ticks / 10000);
  }

  /**
   * Converts milliseconds to .NET ticks
   *
   * @param {string} ms - Number of milliseconds to convert
   * @returns {number} The converted value in .NET ticks
   */
  function msToTicks(ms: number): number {
    return Math.round(ms * 10000);
  }

  /**
   * Returns the end time of an item
   *
   * @param {number} ticks - Ticks of the item to calculate
   * @param {boolean} suffix - Whether to add or not the PM or AM prefix
   * @returns {string} The resulting string
   */
  function getEndsAtTime(ticks: number, suffix = true): string {
    const ms = ticksToMs(ticks);
    const endTimeLong = new Date(Date.now() + ms);
    let formattedTime;

    if (!suffix) {
      formattedTime = endTimeLong.toLocaleString(locale.value, {
        hour: 'numeric',
        minute: 'numeric'
      });
    } else {
      formattedTime = format(Date.now() + ms, 'p', {
        // locale: locale.value
      });
    }

    // TODO: Use a Date object
    return t('endsAt', {
      time: formattedTime
    });
  }

  /**
   * Returns the duration of an item in the following format: X hours Y minutes
   *
   * @param {number} ticks - Ticks of the item to calculate
   * @returns {string} The resulting string
   */
  function getRuntimeTime(ticks: number): string {
    const ms = ticksToMs(ticks);

    return formatDuration(intervalToDuration({ start: 0, end: ms }), {
      format: ['hours', 'minutes']
      // locale: locale.value
    });
  }

  return { msToTicks, ticksToMs, getEndsAtTime, getRuntimeTime };
}
