/**
 * Utility for converting time between ticks and milliseconds
 *
 * @mixin
 */
import Vue from 'vue';

const timeUtils = Vue.extend({
  methods: {
    /**
     * Converts time from ticks to ms
     *
     * @param {string} ticks number of ticks to convert from
     * @returns {number} Correct number of ms
     */
    ticksToMs(ticks: number): number {
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
