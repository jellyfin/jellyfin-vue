<template>
  <v-btn icon class="align-self-center">
    <v-icon>
      <i-mdi-cog />
    </v-icon>
    <v-tooltip
      :text="$t('playbackSettings')"
      location="top"
      activator="parent" />
    <v-menu
      v-model="menuModel"
      :close-on-content-click="false"
      :transition="'slide-y-transition'"
      location="top"
      activator="parent">
      <v-card min-width="300">
        <v-card-text>
          <v-row align="center">
            <v-col :cols="4">
              <label>{{ $t('quality') }}</label>
            </v-col>
            <v-col :cols="8">
              <v-select density="comfortable" hide-details disabled />
            </v-col>
          </v-row>
          <v-row align="center">
            <v-col :cols="4">
              <label>{{ $t('audio') }}</label>
            </v-col>
            <v-col :cols="8">
              <media-stream-selector
                v-if="playbackManager.currentItemAudioTracks"
                :media-streams="playbackManager.currentItemAudioTracks"
                type="Audio"
                :default-stream-index="playbackManager.currentAudioStreamIndex"
                @input="playbackManager.currentAudioStreamIndex = $event" />
            </v-col>
          </v-row>
          <v-row v-if="!$vuetify.display.smAndUp" align="center">
            <v-col :cols="4">
              <label>{{ $t('subtitles') }}</label>
            </v-col>
            <v-col :cols="8">
              <media-stream-selector
                v-if="playbackManager.currentItemSubtitleTracks"
                :media-streams="playbackManager.currentItemSubtitleTracks"
                type="Subtitle"
                :default-stream-index="
                  playbackManager.currentSubtitleStreamIndex
                "
                @input="playbackManager.currentSubtitleStreamIndex = $event" />
            </v-col>
          </v-row>
          <v-row align="center">
            <v-col :cols="4">
              <label>{{ $t('speed') }}</label>
            </v-col>
            <v-col :cols="8">
              <v-select density="comfortable" disabled hide-details />
            </v-col>
          </v-row>
          <v-row align="center">
            <v-col :cols="4">
              <label>{{ $t('stretch') }}</label>
            </v-col>
            <v-col :cols="8" class="text-right">
              <v-switch v-model="stretched" color="primary" hide-details />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-menu>
  </v-btn>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useVModel } from '@vueuse/core';
import { playbackManagerStore, playerElementStore } from '@/store';

const props = defineProps<{
  modelValue: boolean;
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
}>();

const menuModel = useVModel(props, 'modelValue', emit);

const playbackManager = playbackManagerStore();
const playerElement = playerElementStore();

const stretched = computed({
  get() {
    return playerElement.isStretched;
  },
  set(v: boolean) {
    playerElement.isStretched = v;
  }
});
</script>
