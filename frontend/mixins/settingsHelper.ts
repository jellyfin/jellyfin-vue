/**
 * Helper for watching client settings
 *
 * @mixin
 */
import Vue from 'vue';
import { mapStores } from 'pinia';
import { clientSettingsStore } from '~/store';

const settingsHelper = Vue.extend({
  computed: {
    ...mapStores(clientSettingsStore)
  },
  watch: {
    'clientSettings.darkMode': {
      immediate: true,
      handler(): void {
        this.$vuetify.theme.dark = this.clientSettings.darkMode;
      }
    },
    'clientSettings.locale': {
      immediate: true,
      handler(): void {
        if (this.clientSettings.locale !== 'auto') {
          this.$i18n.setLocale(this.clientSettings.locale);
        } else {
          this.$i18n.setLocale(
            this.$i18n.getBrowserLocale() || this.$i18n.defaultLocale || 'en-US'
          );
        }
      }
    }
  }
});

export default settingsHelper;
