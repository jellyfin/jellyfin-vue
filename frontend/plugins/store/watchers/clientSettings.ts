import { Context } from '@nuxt/types';
import { clientSettingsStore } from '~/store';

/**
 * React to changes in client settings
 */
export default function (ctx: Context): void {
  const clientSettings = clientSettingsStore();

  clientSettings.$subscribe(() => {
    /**
     * Theme change
     */
    ctx.$vuetify.theme.dark = clientSettings.darkMode;

    /**
     * Locale change
     */
    if (clientSettings.locale !== 'auto') {
      ctx.i18n.setLocale(clientSettings.locale);
    } else {
      ctx.i18n.setLocale(
        ctx.i18n.getBrowserLocale() || ctx.i18n.defaultLocale || 'en-US'
      );
    }
  });
}
