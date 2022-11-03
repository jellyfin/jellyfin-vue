import { PiniaPluginContext } from 'pinia';
import { useNavigatorLanguage } from '@vueuse/core';
import { useTheme } from 'vuetify/lib/framework.mjs';
import { useI18n } from 'vue-i18n';
import { clientSettingsStore } from '~/store';

/**
 * React to changes in client settings
 */
export default function (_ctx: PiniaPluginContext): void {
  const clientSettings = clientSettingsStore();

  clientSettings.$subscribe((_mutation, state) => {
    const theme = useTheme();
    const i18n = useI18n();

    /**
     * Theme change
     */

    theme.global.name.value = state.darkMode ? 'dark' : 'light';

    /**
     * Locale change
     */
    if (state.locale !== 'auto') {
      i18n.locale.value = state.locale;
    } else {
      i18n.locale.value =
        useNavigatorLanguage().language.value ||
        String(i18n.fallbackLocale.value);
    }
  });
}
