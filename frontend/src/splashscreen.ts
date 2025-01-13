/**
 * This modules handles the splashscreen color scheme based on user-agent preferences or stored settings
 * before Vue is loaded.
 *
 * When Vue is loaded, it gets replaced by the main application and the JSplashscreen (used in App.vue)
 * is displayed instead.
 */
import { destr } from 'destr';
import { isBool } from '@jellyfin-vue/shared/validation';
import type { ClientSettingsState } from '#/store/client-settings';
import '#/assets/styles/splashscreen.css';

const store = localStorage.getItem('clientSettings') ?? '{}';
const parsedStore = destr<ClientSettingsState>(store);
const matchedDarkColorScheme = globalThis.matchMedia(
  '(prefers-color-scheme: dark)'
).matches;
const darkColor = '#111827';
const lightColor = '#f2f2f2';
let colorToApply: typeof darkColor | typeof lightColor = matchedDarkColorScheme ? darkColor : lightColor;

const storeDarkMode = parsedStore.darkMode;

if (isBool(storeDarkMode)) {
  colorToApply = storeDarkMode ? darkColor : lightColor;
}

document.body.style.setProperty('--j-theme-color-background', colorToApply);
