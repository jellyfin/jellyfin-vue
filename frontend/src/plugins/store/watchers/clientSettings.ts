import { PiniaPluginContext } from 'pinia';
import { clientSettingsStore } from '~/store';
import { useNavigatorLanguage } from '@vueuse/core';

/**
 * React to changes in client settings
 */
export default function (ctx: PiniaPluginContext): void {
  const clientSettings = clientSettingsStore();

  clientSettings.$subscribe((_mutation, state) => {
    /**
     * Theme change
     */
    ctx.app.$vuetify.theme.dark = state.darkMode;

    /**
     * Locale change
     */
    if (state.locale !== 'auto') {
      ctx.app.$i18n.locale = state.locale;
    } else {
      ctx.app.$i18n.locale =
        useNavigatorLanguage().language || ctx.app.$i18n.fallbackLocale;
    }
  });
}
