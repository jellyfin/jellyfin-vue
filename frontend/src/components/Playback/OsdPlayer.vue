<template>
  <v-overlay
    v-model="overlay"
    contained
    scrim="transparent"
    width="100%"
    height="100%">
    <div
      class="d-flex flex-column justify-space-between align-center player-overlay">
      <div class="osd-top pt-s pl-s pr-s">
        <div class="d-flex align-center py-2 px-4">
          <div class="d-flex">
            <v-btn :icon="IMdiClose" @click="playbackManager.stop" />
            <v-btn
              :icon="IMdiChevronDown"
              @click="playerElement.toggleMinimize" />
          </div>
          <div class="d-flex ml-auto">
            <cast-button />
          </div>
        </div>
      </div>
      <div class="osd-bottom pb-s pl-s pr-s">
        <div class="pa-4">
          <time-slider />
          <div
            class="controls-wrapper d-flex align-stretch justify-space-between">
            <div
              v-if="$vuetify.display.mdAndUp"
              class="d-flex flex-column align-start justify-center mr-auto video-title">
              <template
                v-if="
                  playbackManager.currentlyPlayingType === BaseItemKind.Episode
                ">
                <span class="mt-1 text-subtitle-1 text-truncate">
                  {{ playbackManager.currentItem?.Name }}
                </span>
                <span class="text-subtitle-2 text--secondary text-truncate">
                  {{ playbackManager.currentItem?.SeriesName }}
                </span>
                <span class="text-subtitle-2 text--secondary text-truncate">
                  {{
                    $t('seasonEpisode', {
                      seasonNumber:
                        playbackManager.currentItem?.ParentIndexNumber,
                      episodeNumber: playbackManager.currentItem?.IndexNumber
                    })
                  }}
                </span>
              </template>
              <template v-else>
                <span>{{ playbackManager.currentItem?.Name }}</span>
              </template>
            </div>
            <div
              class="d-flex player-controls align-center justify-start justify-md-center">
              <v-btn
                icon
                class="mx-1"
                @click="playbackManager.setPreviousTrack">
                <v-icon>
                  <i-mdi-skip-previous />
                </v-icon>
              </v-btn>
              <v-btn
                icon
                class="mx-1 active-button"
                @click="playbackManager.playPause">
                <v-icon size="large">
                  <i-mdi-play-circle-outline v-if="playbackManager.isPaused" />
                  <i-mdi-pause-circle-outline v-else />
                </v-icon>
              </v-btn>
              <v-btn icon class="mx-1" @click="playbackManager.setNextTrack">
                <v-icon>
                  <i-mdi-skip-next />
                </v-icon>
              </v-btn>
            </div>
            <div class="d-flex aligh-center ml-auto ml-md-0">
              <volume-slider v-if="$vuetify.display.smAndUp" class="mr-2" />
              <queue-button :close-on-click="true" />
              <subtitle-selection-button
                v-if="$vuetify.display.smAndUp"
                v-model="subtitleSelectionButtonOpened" />
              <playback-settings-button
                v-model="playbackSettingsButtonOpened" />
              <v-btn
                v-if="mediaControls.supportsPictureInPicture"
                class="align-self-center active-button"
                icon
                @click="mediaControls.togglePictureInPicture">
                <v-icon>
                  <i-mdi-picture-in-picture-bottom-right />
                </v-icon>
              </v-btn>
              <tooltip-button
                class="align-self-center active-button"
                :tooltip="{ text: $t('fullScreen'), location: 'top' }"
                :btn="{ icon: true }"
                @click="$emit('toggleFullscreen')">
                <v-icon>
                  <i-mdi-fullscreen v-if="!$props.isFullscreen" />
                  <i-mdi-fullscreen-exit v-else />
                </v-icon>
              </tooltip-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </v-overlay>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue';
import IMdiClose from 'virtual:icons/mdi/close';
import IMdiChevronDown from 'virtual:icons/mdi/chevron-down';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client';
import {
  useTimeoutFn,
  useEventListener,
  useMagicKeys,
  whenever
} from '@vueuse/core';
import { playbackManagerStore, playerElementStore } from '@/store';
import { mediaControls } from '@/store/playbackManager';

const emit = defineEmits<{
  (e: 'toggleFullscreen'): void;
  (e: 'update:modelValue', val: boolean): void;
}>();

const props = defineProps<{
  modelValue: boolean;
  isFullscreen: boolean;
}>();

const playbackManager = playbackManagerStore();
const playerElement = playerElementStore();

const subtitleSelectionButtonOpened = ref(false);
const playbackSettingsButtonOpened = ref(false);
const staticOverlay = computed(
  () =>
    playbackManager.isPaused ||
    subtitleSelectionButtonOpened.value ||
    playbackSettingsButtonOpened.value
);

const overlay = computed({
  get: () => props.modelValue || staticOverlay.value,
  set: (val: boolean) => {
    emit('update:modelValue', val);
  }
});

watch(staticOverlay, (val) => {
  if (val) {
    timeout.stop();
  } else {
    timeout.start();
  }
});

const timeout = useTimeoutFn(() => {
  overlay.value = false;
}, 5000);

/**
 * Shows the overlay on mouse move and starts the timeout to hide it, unless the overlay must stay static
 */
function handleMouseMove(): void {
  if (!staticOverlay.value) {
    overlay.value = true;
    timeout.start();
  }
}

const keys = useMagicKeys();

whenever(keys.space, playbackManager.playPause);
whenever(keys.k, playbackManager.playPause);
whenever(keys.right, playbackManager.skipForward);
whenever(keys.l, playbackManager.skipForward);
whenever(keys.left, playbackManager.skipBackward);
whenever(keys.j, playbackManager.skipBackward);
whenever(keys.f, () => emit('toggleFullscreen'));
whenever(keys.m, playbackManager.toggleMute);

useEventListener(document, 'mousemove', handleMouseMove);
useEventListener(document, 'touchend', handleMouseMove);
</script>

<style lang="scss">
// These don't work when scoped, for some reason.

.player {
  overflow-y: hidden;
}

.player--fullscreen {
  position: relative;
  width: 100vw !important;
  height: 100vh !important;
  max-height: 100% !important;
  margin: 0 !important;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
}

.player--minimized {
  justify-self: end !important;
  position: relative;
  margin: 0 !important;
  margin-left: auto !important;
  top: auto;
  left: auto;
  bottom: 2em;
  right: 2em;
}
</style>

<style lang="scss" scoped>
.playback-data-dialog {
  position: absolute;
  z-index: 999;
}

.v-card.player-card {
  background-color: black !important;
}

.controls-wrapper {
  position: relative;
}

/* stylelint-disable-next-line */
.v-overlay::v-deep .v-overlay__content {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

.player-overlay {
  height: 100%;
}

.osd-top,
.osd-bottom {
  width: 100%;
  padding: 8px;
}

.osd-bottom > div,
.osd-top > div {
  max-width: calc(100vh * 1.77 - 2vh);
  margin: auto;
}

.osd-top {
  padding-bottom: 5em;
  background: linear-gradient(
    to bottom,
    hsla(0, 0%, 0%, 0.75) 0%,
    hsla(0, 0%, 0%, 0.74) 8.1%,
    hsla(0, 0%, 0%, 0.714) 15.5%,
    hsla(0, 0%, 0%, 0.672) 22.5%,
    hsla(0, 0%, 0%, 0.618) 29%,
    hsla(0, 0%, 0%, 0.556) 35.3%,
    hsla(0, 0%, 0%, 0.486) 41.2%,
    hsla(0, 0%, 0%, 0.412) 47.1%,
    hsla(0, 0%, 0%, 0.338) 52.9%,
    hsla(0, 0%, 0%, 0.264) 58.8%,
    hsla(0, 0%, 0%, 0.194) 64.7%,
    hsla(0, 0%, 0%, 0.132) 71%,
    hsla(0, 0%, 0%, 0.078) 77.5%,
    hsla(0, 0%, 0%, 0.036) 84.5%,
    hsla(0, 0%, 0%, 0.01) 91.9%,
    hsla(0, 0%, 0%, 0) 100%
  );
}

.osd-bottom {
  padding-top: 6em;
  background: linear-gradient(
    to top,
    hsla(0, 0%, 0%, 0.75) 0%,
    hsla(0, 0%, 0%, 0.74) 8.1%,
    hsla(0, 0%, 0%, 0.714) 15.5%,
    hsla(0, 0%, 0%, 0.672) 22.5%,
    hsla(0, 0%, 0%, 0.618) 29%,
    hsla(0, 0%, 0%, 0.556) 35.3%,
    hsla(0, 0%, 0%, 0.486) 41.2%,
    hsla(0, 0%, 0%, 0.412) 47.1%,
    hsla(0, 0%, 0%, 0.338) 52.9%,
    hsla(0, 0%, 0%, 0.264) 58.8%,
    hsla(0, 0%, 0%, 0.194) 64.7%,
    hsla(0, 0%, 0%, 0.132) 71%,
    hsla(0, 0%, 0%, 0.078) 77.5%,
    hsla(0, 0%, 0%, 0.036) 84.5%,
    hsla(0, 0%, 0%, 0.01) 91.9%,
    hsla(0, 0%, 0%, 0) 100%
  );
}

.player-controls {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.video-title {
  max-width: 40vw;
  height: 6em;
}

// HACK: https://github.com/vuetifyjs/vuetify/issues/8436.
// https://vuetifyjs.com/en/api/v-btn/#retain-focus-on-click prop was added
// but it seems we're using a prop combination that it's incompatible with it: NaN;

// SO link: https://stackoverflow.com/questions/57830767/is-it-default-for-vuetify-to-keep-active-state-on-buttons-after-click-how-do-yo/57831256#57831256
.active-button:focus::before {
  opacity: 0 !important;
}
</style>
