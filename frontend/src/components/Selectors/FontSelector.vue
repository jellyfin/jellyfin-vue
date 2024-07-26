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
    v-if="isQueryLocalFontsSupported && !fontAccess"
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
  </VAlert>

  <VSelect
    v-model="model"
    :label="label"
    :items="fontList"
    :disabled="!isQueryLocalFontsSupported || !fontAccess" />
</template>

<script setup lang="ts">
import { usePermission, useSupported } from '@vueuse/core';
import { ref, computed, watchEffect } from 'vue';
import { useI18n } from 'vue-i18n';

defineProps<{
  label?: string;
}>();

const { t } = useI18n();

const model = defineModel<string | undefined>();
const fontList = ref<string[]>([]);

const fontPermission = usePermission('local-fonts');
const fontAccess = computed(() => fontPermission.value == 'granted');
const isQueryLocalFontsSupported = useSupported(() => 'queryLocalFonts' in window);

watchEffect(async () => {
  if (isQueryLocalFontsSupported.value && fontAccess.value) {
    const localFonts = await window.queryLocalFonts();
    const uniqueFonts: string[] = [];

    for (const font of localFonts) {
      if (!uniqueFonts.includes(font.family)) {
        uniqueFonts.push(font.family);
      }
    }

    fontList.value = uniqueFonts;
  }
});
</script>
