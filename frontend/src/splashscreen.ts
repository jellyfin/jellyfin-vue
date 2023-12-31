/**
 * Load splashcreen color scheme based on stored settings or user-agent preferences
 */
import { destr } from 'destr';
import type { ClientSettingsState } from './store/clientSettings';

const store = localStorage.getItem('clientSettings') ?? '{}';
const parsedStore = destr<ClientSettingsState>(store);
const matchedDarkColorScheme = window.matchMedia(
  '(prefers-color-scheme: dark)'
).matches;
let classToApply: 'light' | 'dark' = matchedDarkColorScheme ? 'dark' : 'light';

if ('darkMode' in parsedStore) {
  const storeDarkMode = parsedStore.darkMode;

  if (typeof storeDarkMode === 'boolean') {
    classToApply = parsedStore.darkMode === true ? 'dark' : 'light';
  }
}

const element = document.querySelector('.splashBackground');

if (element) {
  element.classList.add(classToApply);
}
