/**
 * This modules handles the splashscreen color scheme based on user-agent preferences or stored settings
 * before Vue is loaded.
 *
 * When Vue is loaded, it gets replaced by the main application and the JSplashscreen (used in App.vue)
 * is displayed instead.
 */
import { destr } from 'destr';
import type { ClientSettingsState } from '@/store/client-settings';
import { isBool } from '@/utils/validation';
import '@/assets/styles/splashscreen.css';

const store = localStorage.getItem('clientSettings') ?? '{}';
const parsedStore = destr<ClientSettingsState>(store);
const matchedDarkColorScheme = window.matchMedia(
  '(prefers-color-scheme: dark)'
).matches;
const darkColor = '#111827';
const lightColor = '#f2f2f2';
let colorToApply: typeof darkColor | typeof lightColor = matchedDarkColorScheme ? darkColor : lightColor;

if ('darkMode' in parsedStore) {
  const storeDarkMode = parsedStore.darkMode;

  if (isBool(storeDarkMode)) {
    colorToApply = parsedStore.darkMode === true ? darkColor : lightColor;
  }
}

document.body.style.setProperty('--j-color-background', colorToApply);
