/**
 * Helpers for modals
 *
 * @mixin
 */
import Vue from 'vue';

declare module '@nuxt/types' {
  interface Context {
    smallModalWidth: () => string | number;
  }

  interface NuxtAppOptions {
    smallModalWidth: () => string | number;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    smallModalWidth: () => string | number;
  }
}

const modalHelper = Vue.extend({
  computed: {
    smallModalWidth(): string | number {
      if (this.$vuetify.breakpoint.smAndDown) {
        return '90%';
      } else {
        return 600;
      }
    }
  }
});

export default modalHelper;
