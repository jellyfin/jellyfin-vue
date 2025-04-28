import { resolve } from 'node:path';
import { getPackagePath } from '@jellyfin-vue/shared/utils';

export const localeFilesFolder = resolve(getPackagePath('@jellyfin-vue/i18n'), 'strings/**');
