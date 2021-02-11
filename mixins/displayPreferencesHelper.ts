/**
 * Helper for watching display preferences
 *
 * @mixin
 */
import Vue from 'vue';

declare module '@nuxt/types' {
  interface Context {
    watchDarkMode: () => void;
    watchLocale: () => void;
  }

  interface NuxtAppOptions {
    watchDarkMode: () => void;
    watchLocale: () => void;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    watchDarkMode: () => void;
    watchLocale: () => void;
  }
}

const displayPreferencesHelper = Vue.extend({
  methods: {
    watchDarkMode(): void {
      this.$store.watch(
        (_state, getters) => getters['displayPreferences/getDarkMode'],
        (darkMode: boolean) => {
          this.$vuetify.theme.dark = darkMode;
        }
      );
      this.$vuetify.theme.dark = this.$store.getters[
        'displayPreferences/getDarkMode'
      ];
    },
    watchLocale(): void {
      const apply = (locale: string): void => {
        if (locale !== 'auto') this.$i18n.setLocale(locale);
        else
          this.$i18n.setLocale(
            this.$i18n.getBrowserLocale() || this.$i18n.defaultLocale || 'en'
          );
      };

      this.$store.watch(
        (_state, getters) => getters['displayPreferences/getLocale'],
        apply
      );

      apply(this.$store.getters['displayPreferences/getLocale']);
    }
  }
});

export default displayPreferencesHelper;
