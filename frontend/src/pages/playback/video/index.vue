<template>
  <v-main
    class="fullscreen-video-container fill-height"
    :class="{ 'cursor-none': !overlay }"
    @mousemove="handleMouseMove"
    @touchend="handleMouseMove">
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
                @click="playerElement.toggleFullscreenVideoPlayer" />
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
                    playbackManager.currentlyPlayingType ===
                    BaseItemKind.Episode
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
                <br />
                <span
                  v-if="playbackManager.currentItem?.RunTimeTicks"
                  class="text-subtitle-2 text--secondary text-truncate">
                  {{
                    getEndsAtTime(playbackManager.currentItem.RunTimeTicks)
                      .value
                  }}
                </span>
              </div>
              <div
                class="d-flex player-controls align-center justify-start justify-md-center">
                <previous-track-button class="mx-1" />
                <play-pause-button class="mx-1" />
                <next-track-button class="mx-1" />
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
                  class="align-self-center"
                  icon
                  @click="mediaControls.togglePictureInPicture">
                  <v-icon>
                    <i-mdi-picture-in-picture-bottom-right />
                  </v-icon>
                </v-btn>
                <tooltip-button
                  class="align-self-center"
                  :tooltip="{ text: $t('fullScreen'), location: 'top' }"
                  :btn="{ icon: true }"
                  @click="toggleFullscreen">
                  <v-icon>
                    <i-mdi-fullscreen v-if="fullscreen.isFullscreen" />
                    <i-mdi-fullscreen-exit v-else />
                  </v-icon>
                </tooltip-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </v-overlay>
  </v-main>
</template>

<route lang="yaml">
meta:
  layout: fullpage
  transition:
    enter: 'scroll-y-reverse-transition'
    leave: 'scroll-y-transition'
</route>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref, computed, watch } from 'vue';
import IMdiClose from 'virtual:icons/mdi/close';
import IMdiChevronDown from 'virtual:icons/mdi/chevron-down';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client';
import {
  useFullscreen,
  useTimeoutFn,
  useMagicKeys,
  whenever
} from '@vueuse/core';
import {
  playbackManagerStore,
  playerElementStore,
  mediaElementRef,
  mediaControls
} from '@/store';
import { getEndsAtTime } from '@/utils/time';

const keys = useMagicKeys();
const fullscreen = useFullscreen(document.body);
const playbackManager = playbackManagerStore();
const playerElement = playerElementStore();
const osd = ref(true);
const subtitleSelectionButtonOpened = ref(false);
const playbackSettingsButtonOpened = ref(false);
const staticOverlay = computed(
  () =>
    playbackManager.isPaused ||
    subtitleSelectionButtonOpened.value ||
    playbackSettingsButtonOpened.value
);

const overlay = computed({
  get: () => staticOverlay.value || osd.value,
  set: (newValue) => (osd.value = newValue)
});

const timeout = useTimeoutFn(() => {
  overlay.value = false;
}, 5000);

/**
 * Shows the overlay on mouse move and starts the timeout to hide it, unless the overlay must stay static
 */
function handleMouseMove(): void {
  overlay.value = true;
  timeout.start();
}

/**
 * Toggles the fullscreen view, based on browsers supporting it or not (basically iOS or the others)
 */
function toggleFullscreen(): void {
  if (fullscreen.isSupported.value) {
    fullscreen.toggle();
  } else if (
    !fullscreen.isSupported.value &&
    // @ts-expect-error - Property 'webkitEnterFullScreen' does not exist on type 'HTMLMediaElement'
    mediaElementRef.value?.webkitEnterFullScreen
  ) {
    /**
     * Use case for iOS where the fullscreen methods on non <video> elements aren't supported
     */
    // TODO - if entering FS this way, SSA subs won't display. So we should trigger a new encode
    // @ts-expect-error - Property 'webkitEnterFullScreen' does not exist on type 'HTMLMediaElement'
    mediaElementRef.value?.webkitEnterFullScreen();
  }
}

onBeforeUnmount(() => {
  if (fullscreen.isFullscreen.value) {
    fullscreen.exit();
  }

  if (playerElement.isFullscreenVideoPlayer) {
    playbackManager.stop();
  }

  /**
   * We need to destroy JASSUB so the canvas can be recreated in the other view
   */
  playerElement.freeSsaTrack();
  playerElement.isFullscreenMounted = false;
});

onMounted(() => {
  playerElement.isFullscreenMounted = true;
});

whenever(keys.space, playbackManager.playPause);
whenever(keys.k, playbackManager.playPause);
whenever(keys.right, playbackManager.skipForward);
whenever(keys.l, playbackManager.skipForward);
whenever(keys.left, playbackManager.skipBackward);
whenever(keys.j, playbackManager.skipBackward);
whenever(keys.f, toggleFullscreen);
whenever(keys.m, playbackManager.toggleMute);

watch(staticOverlay, (val) => {
  if (val) {
    timeout.stop();
  } else {
    timeout.start();
  }
});
</script>

<style>
.fullscreen-video-container video {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 100%;
  max-height: 100%;
}

.fullscreen-video-container video.stretched {
  width: 100%;
  height: 100%;
}
</style>

<style scoped>
.fullscreen-video-container {
  background: black;
}

.controls-wrapper {
  position: relative;
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
</style>
