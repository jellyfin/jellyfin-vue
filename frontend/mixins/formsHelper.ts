/**
 * Helper for form related functions
 *
 * @mixin
 */
import Vue from 'vue';

interface VSelectItem {
  value: unknown;
}

declare module '@nuxt/types' {
  interface Context {
    getItemizedSelect: (values: unknown[]) => VSelectItem[];
  }

  interface NuxtAppOptions {
    getItemizedSelect: (values: unknown[]) => VSelectItem[];
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    getItemizedSelect: (values: unknown[]) => VSelectItem[];
  }
}

const formsHelper = Vue.extend({
  methods: {
    /**
     * Returns a list suitable for use with the 'item' prop for v-select
     *
     * @param {any[]} values - list of values to use for the v-select
     * @returns {VSelectItem[]} list ready to be used in the :item property of a v-select
     */
    getItemizedSelect(values: unknown[]): VSelectItem[] {
      return values.map((value) => {
        return { value };
      });
    }
  }
});

export default formsHelper;
