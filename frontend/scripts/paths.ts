import { resolve } from 'node:path';

export const localeFilesFolder = resolve('locales/**');
export const srcRoot = `${resolve('src')}/`;
export const entrypoints = {
  index: `${resolve('index.html')}`,
  main: `${srcRoot}/main.ts`,
  splashscreen: `${srcRoot}/splashscreen.ts`
};
