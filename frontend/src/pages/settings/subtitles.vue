<template>
  <SettingsPage>
    <template #title>
      {{ $t('subtitles') }}
    </template>

    <template #content>
      <VCol
        md="6"
        class="uno-pb-4 uno-pt-0">
        <VSwitch
          v-model="subtitleSettings.state.enabled"
          :label="$t('enableSubtitles')" />
        <FontSelector
          v-model="subtitleSettings.state.fontFamily"
          :label="$t('subtitleFont')"
          :disabled="!subtitleSettings.state.enabled" />

        <VSlider
          v-model="subtitleSettings.state.fontSize"
          :label="$t('fontSize')"
          :min="1"
          :max="4.5"
          :step="0.1"
          :disabled="!subtitleSettings.state.enabled" />

        <VSlider
          v-model="subtitleSettings.state.positionFromBottom"
          :label="$t('positionFromBottom')"
          :min="0"
          :max="30"
          :step="1"
          :disabled="!subtitleSettings.state.enabled" />

        <VCheckbox
          v-model="subtitleSettings.state.backdrop"
          :label="$t('backdrop')"
          :disabled="!subtitleSettings.state.enabled" />

        <VCheckbox
          v-model="subtitleSettings.state.stroke"
          :label="$t('stroke')"
          :disabled="!subtitleSettings.state.enabled" />

        <SubtitleTrack
          v-if="subtitleSettings.state.enabled"
          preview />
      </VCol>
    </template>
  </SettingsPage>
</template>

<script setup lang="ts">
import { subtitleSettings } from '@/store/client-settings/subtitle-settings';
</script>
