/**
 * Utility for converting time between ticks and milliseconds
 *
 * @mixin
 */
import Vue from 'vue';

declare module '@nuxt/types' {
  interface Context {
    ticksToMs: (ticks: number) => number;
    msToTicks: (ms: number) => number;
  }

  interface NuxtAppOptions {
    ticksToMs: (ticks: number) => number;
    msToTicks: (ms: number) => number;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    ticksToMs: (ticks: number | null | undefined) => number;
    msToTicks: (ms: number) => number;
  }
}

const timeUtils = Vue.extend({
  methods: {
    /**
     * Converts time from ticks to ms
     *
     * @param {string} ticks number of ticks to convert from
     * @returns {number} Correct number of ms
     */
    ticksToMs(ticks: number | null | undefined): number {
      if (!ticks) {
        ticks = 0;
      }
      return ticks / 10000;
    },
    /**
     * Converts time from ms to ticks
     *
     * @param {string} ms number of ms to convert from
     * @returns {number} Correct number of ticks
     */
    msToTicks(ms: number): number {
      return ms * 10000;
    }
  }
});

export default timeUtils;
