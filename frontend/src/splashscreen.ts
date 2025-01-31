/**
 * This modules handles the splashscreen color scheme based on user-agent preferences or stored settings
 * before Vue is loaded.
 *
 * When Vue is loaded, it gets replaced by the main application and the JSplashscreen (used in App.vue)
 * is displayed instead.
 */
import { destr } from 'destr';
import type { PartialDeep } from 'type-fest';
import { darkColors, lightColors } from '@jellyfin-vue/shared/colors';
import type { ThemeSettingsState } from '#/store/settings/theme';
import '#/assets/styles/splashscreen.css';

const store = localStorage.getItem('themeSettings') ?? '{}';
const parsedStore = destr<PartialDeep<ThemeSettingsState>>(store);
const matchedDarkColorScheme = globalThis.matchMedia(
  '(prefers-color-scheme: dark)'
).matches;
const isDark = parsedStore.darkMode ?? matchedDarkColorScheme;
const storeColors = parsedStore.colors?.[isDark ? 'dark' : 'light'];

/**
 * Fallback when the store is not initialized yet (first start)
 */
const defaults = matchedDarkColorScheme ? darkColors() : lightColors();
const colorToApply = (storeColors ?? defaults).background!;

document.body.style.setProperty('--j-theme-color-background', colorToApply);
