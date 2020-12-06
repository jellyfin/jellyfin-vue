/**
 * Helpers for modals
 *
 * @mixin
 */
import Vue from 'vue';

declare module '@nuxt/types' {
  interface Context {
    errorModalWidth: () => string | number;
  }

  interface NuxtAppOptions {
    errorModalWidth: () => string | number;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    errorModalWidth: () => string | number;
  }
}

const modalHelper = Vue.extend({
  computed: {
    errorModalWidth(): string | number {
      if (this.$vuetify.breakpoint.smAndDown) {
        return '90%';
      } else if (
        this.$vuetify.breakpoint.smAndUp &&
        !this.$vuetify.breakpoint.mdAndUp
      ) {
        return 600;
      } else if (
        this.$vuetify.breakpoint.mdAndUp &&
        !this.$vuetify.breakpoint.lgAndUp
      ) {
        return 600;
      } else {
        return 600;
      }
    }
  }
});

export default modalHelper;
