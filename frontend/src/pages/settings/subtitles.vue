<template>
  <SettingsPage>
    <template #title>
      {{ t('subtitles') }}
    </template>

    <template #content>
      <VCol
        md="6"
        class="pt-0 pb-4">
        <FontSelector
          v-model="clientSettings.subtitleAppearance.fontFamily"
          :label="$t('subtitleFont')" />

        <VSlider
          v-model="clientSettings.subtitleAppearance.fontSize"
          :label="$t('fontSize')"
          :min="1"
          :max="4.5"
          :step="0.1" />

        <VSlider
          v-model="clientSettings.subtitleAppearance.positionFromBottom"
          :label="$t('positionFromBottom')"
          :min="0"
          :max="30"
          :step="1" />

        <VCheckbox
          v-model="clientSettings.subtitleAppearance.backdrop"
          :label="$t('backdrop')" />

        <VCheckbox
          v-model="clientSettings.subtitleAppearance.stroke"
          :label="$t('stroke')" />

        <SubtitleTrack :preview-text="$t('subtitlePreviewText')" />
      </VCol>
    </template>
  </SettingsPage>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router/auto';
import { clientSettings } from '@/store/client-settings';

const { t } = useI18n();
const route = useRoute();

route.meta.title = t('subtitles');
</script>
