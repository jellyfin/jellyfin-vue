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
          v-model="subtitleSettings.state.value.enabled"
          :label="$t('enableSubtitles')" />
        <FontSelector
          v-model="subtitleSettings.state.value.fontFamily"
          :label="$t('subtitleFont')"
          :disabled="!subtitleSettings.state.value.enabled" />

        <VSlider
          v-model="subtitleSettings.state.value.fontSize"
          :label="$t('fontSize')"
          :min="1"
          :max="4.5"
          :step="0.1"
          :disabled="!subtitleSettings.state.value.enabled" />

        <VSlider
          v-model="subtitleSettings.state.value.positionFromBottom"
          :label="$t('positionFromBottom')"
          :min="0"
          :max="30"
          :step="1"
          :disabled="!subtitleSettings.state.value.enabled" />

        <VCheckbox
          v-model="subtitleSettings.state.value.backdrop"
          :label="$t('backdrop')"
          :disabled="!subtitleSettings.state.value.enabled" />

        <VCheckbox
          v-model="subtitleSettings.state.value.stroke"
          :label="$t('stroke')"
          :disabled="!subtitleSettings.state.value.enabled" />

        <SubtitleTrack
          v-if="subtitleSettings.state.value.enabled"
          preview />
      </VCol>
    </template>
  </SettingsPage>
</template>

<script setup lang="ts">
import { subtitleSettings } from '#/store/settings/subtitle';
</script>
