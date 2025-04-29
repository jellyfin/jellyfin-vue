<template>
  <VAlert
    v-if="!isQueryLocalFontsSupported"
    class="uno-mb-5"
    color="warning"
    icon="$warning">
    {{ $t('queryLocalFontsNotSupportedWarning') }}
    <br>
    <a
      class="uno-font-bold"
      href="https://caniuse.com/mdn-api_window_querylocalfonts"
      target="_blank"
      rel="noopener">
      {{ $t('learnMore') }}
    </a>
  </VAlert>

  <VAlert
    v-else-if="!fontAccess"
    class="uno-mb-5"
    color="warning"
    icon="$warning">
    {{ $t('localFontsPermissionWarning') }}
    <br>
    <a
      class="uno-font-bold"
      href="https://support.google.com/chrome/answer/114662?hl=en&co=GENIE.Platform=Desktop"
      target="_blank"
      rel="noopener">
      {{ $t('enablePermission') }}
    </a>
    <a
      class="uno-font-bold"
      @click="askForPermission">
      {{ $t('askAgain') }}
    </a>
  </VAlert>

  <VSelect
    v-model="_model"
    v-bind="$attrs"
    :items="selection"
    :disabled="!isQueryLocalFontsSupported || !fontAccess || disabled" />
</template>

<script setup lang="ts">
import { computedAsync, usePermission, useSupported } from '@vueuse/core';
import { computed } from 'vue';
import { useTranslation } from 'i18next-vue';
import { DEFAULT_TYPOGRAPHY, themeSettings } from '#/store/settings/theme';

const { appWide } = defineProps<{
  /**
   * If this font selector is used for selecting the typography for the whole app
   */
  appWide?: boolean;
  disabled?: boolean;
}>();

const model = defineModel<string | undefined>();
const { t } = useTranslation();

const { query: permissionQuery, isSupported, state: fontPermission } = usePermission('local-fonts', { controls: true });
const fontAccess = computed(() => fontPermission.value === 'granted');
const isQueryLocalFontsSupported = useSupported(() => isSupported.value && 'queryLocalFonts' in globalThis);
const askForPermission = async () => isQueryLocalFontsSupported.value
  ? Promise.all([permissionQuery, globalThis.queryLocalFonts])
  : undefined;

/**
 * Edge at least doesn't allow for querying the permission directly using navigator.permission,
 * only after querying the fonts, so we perform the query regardless at the beginning.
 */
const fontList = computedAsync(async () => {
  const res: string[] = [];

  if (fontAccess.value || isQueryLocalFontsSupported.value) {
    const set = new Set<string>((await globalThis.queryLocalFonts()).map((font: FontFace) => font.family));

    /**
     * Removes the current selected tpography (in case it's not the default one)
     */
    set.delete(themeSettings.state.value.typography);
    res.push(...set);
  }

  return res;
}, []);

const selection = computed(() => {
  const res = [
    {
      title: t('appDefaultTypography', { value: DEFAULT_TYPOGRAPHY }),
      value: 'default'
    },
    {
      title: t('systemTypography'),
      value: 'system'
    }, ...fontList.value.map(f => ({
      title: f,
      value: f
    }))];

  if (!appWide && !['system', 'default'].includes(themeSettings.state.value.typography)) {
    res.unshift(
      {
        title: t('currentAppTypography', {
          value: themeSettings.state.value.typography
        }),
        value: themeSettings.state.value.typography
      }
    );
  }

  return res;
});

const _model = computed({
  get() {
    if (appWide) {
      return themeSettings.state.value.typography;
    }

    return model.value;
  },
  set(newVal) {
    if (appWide && newVal) {
      themeSettings.state.value.typography = newVal;
    }

    model.value = newVal;
  }
});
</script>
