import { PiniaPluginContext } from 'pinia';
import { clientSettingsStore } from '~/store';

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
      ctx.i18n.setLocale(state.locale);
    } else {
      ctx.i18n.setLocale(
        ctx.i18n.getBrowserLocale() || ctx.i18n.defaultLocale || 'en-US'
      );
    }
  });
}
