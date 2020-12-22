/**
 * Helper for locale functions
 *
 * @mixin
 */
import Vue from 'vue';

declare module '@nuxt/types' {
  interface Context {
    getDfnsLocale(): string;
  }

  interface NuxtAppOptions {
    getDfnsLocale(): string;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    getDfnsLocale(): string;
  }
}

const localeHelper = Vue.extend({
  methods: {
    getDfnsLocale(): string {
      const i18nlocale = this.$i18n.locale;
      let locale;

      if (i18nlocale === 'en') {
        locale = 'enUS';
      } else if (i18nlocale === 'zh') {
        locale = 'zhCN';
      } else {
        locale = i18nlocale;
      }
      return locale;
    }
  }
});

export default localeHelper;
