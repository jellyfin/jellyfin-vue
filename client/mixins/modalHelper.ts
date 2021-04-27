/**
 * Helpers for modals
 *
 * @mixin
 */
import Vue from 'vue';

declare module '@nuxt/types' {
  interface Context {
    smallModalWidth: string | number;
    defaultModalWidth: string | number;
    largeModalWidth: string | number;
    extraLargeModalWidth: string | number;
  }

  interface NuxtAppOptions {
    smallModalWidth: string | number;
    defaultModalWidth: string | number;
    largeModalWidth: string | number;
    extraLargeModalWidth: string | number;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    smallModalWidth: string | number;
    defaultModalWidth: string | number;
    largeModalWidth: string | number;
    extraLargeModalWidth: string | number;
  }
}

const modalHelper = Vue.extend({
  computed: {
    smallModalWidth(): string | number {
      if (this.$vuetify.breakpoint.smAndUp) {
        return 300;
      } else {
        return '100%';
      }
    },
    defaultModalWidth(): string | number {
      if (this.$vuetify.breakpoint.smAndUp) {
        return 500;
      } else {
        return '100%';
      }
    },
    largeModalWidth(): string | number {
      if (this.$vuetify.breakpoint.smAndUp) {
        return 800;
      } else {
        return '100%';
      }
    },
    extraLargeModalWidth(): string | number {
      if (this.$vuetify.breakpoint.smAndUp) {
        return 1140;
      } else {
        return '100%';
      }
    }
  }
});

export default modalHelper;
