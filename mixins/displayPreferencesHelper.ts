/**
 * Helper for watching display preferences
 *
 * @mixin
 */
import Vue from 'vue';
import { mapState } from 'vuex';

const displayPreferencesHelper = Vue.extend({
  computed: {
    ...mapState('displayPreferences', ['darkMode', 'locale'])
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

export default displayPreferencesHelper;
