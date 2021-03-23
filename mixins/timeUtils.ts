/**
 * Utility for converting time between ticks and milliseconds
 *
 * @mixin
 */
import Vue from 'vue';
import { intervalToDuration } from 'date-fns';
import sumBy from 'lodash/sumBy';
import { BaseItemDto } from '@jellyfin/client-axios';

/**
 * Converts .NET ticks to milliseconds
 *
 * @param {(number | null | undefined)} ticks - Number of .NET ticks to convert
 * @returns {number} The converted value in milliseconds
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
 * @param {string} ms - Number of milliseconds to convert
 * @returns {number} The converted value in .NET ticks
 */
export function msToTicks(ms: number): number {
  return Math.round(ms * 10000);
}

declare module '@nuxt/types' {
  interface Context {
    ticksToMs: (ticks: number) => number;
    msToTicks: (ms: number) => number;
    formatTime: (seconds: number) => number;
    getEndsAtTime: (ticks: number, suffix?: boolean) => string;
    getRuntimeTime: (ticks: number) => string;
    getTotalEndsAtTime: (items: BaseItemDto[], suffix?: boolean) => string;
  }

  interface NuxtAppOptions {
    ticksToMs: (ticks: number) => number;
    msToTicks: (ms: number) => number;
    formatTime: (seconds: number) => number;
    getEndsAtTime: (ticks: number, suffix?: boolean) => string;
    getRuntimeTime: (ticks: number) => string;
    getTotalEndsAtTime: (items: BaseItemDto[], suffix?: boolean) => string;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    ticksToMs: (ticks: number | null | undefined) => number;
    msToTicks: (ms: number) => number;
    formatTime: (seconds: number) => number;
    getEndsAtTime: (ticks: number, suffix?: boolean) => string;
    getRuntimeTime: (ticks: number) => string;
    getTotalEndsAtTime: (items: BaseItemDto[], suffix?: boolean) => string;
  }
}

const timeUtils = Vue.extend({
  methods: {
    /**
     * Converts .NET ticks to milliseconds
     *
     * @param {(number | null | undefined)} ticks - Number of .NET ticks to convert
     * @returns {number} The converted value in milliseconds
     */
    ticksToMs(ticks: number | null | undefined): number {
      return ticksToMs(ticks);
    },
    /**
     * Converts milliseconds to .NET ticks
     *
     * @param {string} ms - Number of milliseconds to convert
     * @returns {number} The converted value in .NET ticks
     */
    msToTicks(ms: number): number {
      return msToTicks(ms);
    },
    formatTime(seconds: number): string {
      let minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      minutes = minutes - hours * 60;
      seconds = Math.floor(seconds - (minutes * 60 + hours * 60 * 60));

      /**
       * Formats Time
       * E.g. 7 -> 07
       *
       * @param {number} number - Number to format
       * @returns {string} Formated seconds number
       */
      function formatDigits(number: number): string {
        return ('0' + number).slice(-2);
      }

      if (hours) {
        return `${hours}:${formatDigits(minutes)}:${formatDigits(seconds)}`;
      } else {
        return `${minutes}:${formatDigits(seconds)}`;
      }
    },
    /**
     * Returns the end time of an item
     *
     * @param {number} ticks - Ticks of the item to calculate
     * @param {boolean} suffix - Whether to add or not the PM or AM prefix
     * @returns {string} The resulting string
     */
    getEndsAtTime(ticks: number, suffix = true): string {
      const ms = this.ticksToMs(ticks);
      const endTimeLong = new Date(Date.now() + ms);
      let format;

      if (!suffix) {
        format = endTimeLong.toLocaleString(this.$i18n.locale, {
          hour: 'numeric',
          minute: 'numeric'
        });
      } else {
        format = this.$dateFns.format(Date.now() + ms, 'p', {
          locale: this.$i18n.locale
        });
      }

      // TODO: Use a Date object
      return this.$t('endsAt', {
        time: format
      });
    },
    /**
     * Returns the duration of an item in the following format: X hours Y minutes
     *
     * @param {number} ticks - Ticks of the item to calculate
     * @returns {string} The resulting string
     */
    getRuntimeTime(ticks: number): string {
      const ms = this.ticksToMs(ticks);

      return this.$dateFns.formatDuration(
        intervalToDuration({ start: 0, end: ms }),
        {
          format: ['hours', 'minutes'],
          locale: this.$i18n.locale
        }
      );
    },
    /**
     * Calculates the end time of an array of BaseItemDto.
     *
     * @param {number} items - Array with the items to calculate.
     * @param {boolean} suffix - Whether to add or not the PM or AM prefix
     * @returns {string} The resulting string
     */
    getTotalEndsAtTime(items: BaseItemDto[], suffix = true): string {
      const ticks = sumBy(items, 'RunTimeTicks');

      return this.getEndsAtTime(ticks, suffix);
    }
  }
});

export default timeUtils;
