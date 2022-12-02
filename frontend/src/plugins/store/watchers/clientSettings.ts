import { useNavigatorLanguage } from '@vueuse/core';
import { clientSettingsStore } from '~/store';
import { usei18n, useVuetify } from '@/composables';

/**
 * React to changes in client settings
 */
export default function (): void {
  const clientSettings = clientSettingsStore();

  clientSettings.$subscribe((_mutation, state) => {
    const vuetify = useVuetify();
    const i18n = usei18n();

    /**
     * Theme change
     */
    vuetify.theme.global.name.value = state.darkMode ? 'dark' : 'light';
    /**
     * Locale change
     */
    i18n.locale.value =
      state.locale !== 'auto'
        ? state.locale
        : useNavigatorLanguage().language.value ||
          String(i18n.fallbackLocale.value);
  });
}
