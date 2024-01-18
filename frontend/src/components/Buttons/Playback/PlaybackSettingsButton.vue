<template>
  <VBtn
    icon
    class="align-self-center">
    <VIcon>
      <IMdiCog />
    </VIcon>
    <VTooltip
      :text="$t('playbackSettings')"
      location="top" />
    <VMenu
      v-model="menuModel"
      :close-on-content-click="false"
      :transition="'slide-y-transition'"
      location="top">
      <VCard min-width="300">
        <VCardText>
          <VRow align="center">
            <VCol :cols="4">
              <label>{{ $t('quality') }}</label>
            </VCol>
            <VCol :cols="8">
              <VSelect
                density="comfortable"
                hide-details
                disabled />
            </VCol>
          </VRow>
          <VRow align="center">
            <VCol :cols="4">
              <label>{{ $t('audio') }}</label>
            </VCol>
            <VCol :cols="8">
              <MediaStreamSelector
                v-if="playbackManager.currentItemAudioTracks"
                :media-streams="playbackManager.currentItemAudioTracks"
                type="Audio"
                :default-stream-index="playbackManager.currentAudioStreamIndex"
                @input="playbackManager.currentAudioStreamIndex = $event" />
            </VCol>
          </VRow>
          <VRow
            v-if="!$vuetify.display.smAndUp"
            align="center">
            <VCol :cols="4">
              <label>{{ $t('subtitles') }}</label>
            </VCol>
            <VCol :cols="8">
              <MediaStreamSelector
                v-if="playbackManager.currentItemSubtitleTracks"
                :media-streams="playbackManager.currentItemSubtitleTracks"
                type="Subtitle"
                :default-stream-index="
                  playbackManager.currentSubtitleStreamIndex
                "
                @input="playbackManager.currentSubtitleStreamIndex = $event" />
            </VCol>
          </VRow>
          <VRow align="center">
            <VCol :cols="4">
              <label>{{ $t('speed') }}</label>
            </VCol>
            <VCol :cols="8">
              <VSelect
                density="comfortable"
                disabled
                hide-details />
            </VCol>
          </VRow>
          <VRow align="center">
            <VCol :cols="4">
              <label>{{ $t('stretch') }}</label>
            </VCol>
            <VCol
              :cols="8"
              class="text-right">
              <VSwitch
                v-model="stretched"
                color="primary"
                hide-details />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VMenu>
  </VBtn>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { playbackManager } from '@/store/playbackManager';
import { playerElement } from '@/store/playerElement';

const menuModel = defineModel<boolean>();

const stretched = computed({
  get() {
    return playerElement.isStretched;
  },
  set(v: boolean) {
    playerElement.isStretched = v;
  }
});
</script>
