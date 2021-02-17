/**
 * Helper for watching client settings
 *
 * @mixin
 */
import Vue from 'vue';
import { mapState } from 'vuex';

const settingsHelper = Vue.extend({
  computed: {
    ...mapState('settings', ['darkMode', 'locale'])
  },
  watch: {
    darkMode: {
      immediate: true,
      handler(): void {
        this.$vuetify.theme.dark = this.darkMode;
      }
    },
    locale: {
      immediate: true,
      handler(): void {
        if (this.locale !== 'auto') {
          this.$i18n.setLocale(this.locale);
        } else {
          this.$i18n.setLocale(
            this.$i18n.getBrowserLocale() || this.$i18n.defaultLocale || 'enUs'
          );
        }
      }
    }
  }
});

export default settingsHelper;
