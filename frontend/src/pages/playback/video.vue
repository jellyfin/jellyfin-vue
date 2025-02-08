<template>
  <div
    ref="videoContainerRef"
    class="fill-height uno-flex uno-justify-center uno-bg-black !uno-h-screen"
    :class="{ 'uno-cursor-none': !overlay }"
    @mousemove.passive="handleMouseMove"
    @touchend.passive="handleMouseMove">
    <JOverlay
      class="uno-h-full uno-flex uno-flex-col uno-items-center uno-justify-between"
      :class="{
        'uno-opacity-100': overlay,
        'uno-opacity-0': !overlay
      }">
      <div class="osd-top pt-s pl-s pr-s">
        <div class="d-flex align-center py-2 px-4">
          <div class="d-flex">
            <VBtn
              icon
              @click="playbackManager.stop">
              <JIcon class="i-mdi:close" />
            </VBtn>
            <VBtn
              icon
              @click="playerElement.toggleFullscreenVideoPlayer">
              <JIcon class="i-mdi:chevron-down" />
            </VBtn>
          </div>
          <div class="d-flex ml-auto">
            <CastButton />
          </div>
        </div>
      </div>
      <div class="pl-s pr-s osd-bottom pb-s">
        <div class="pa-4">
          <TimeSlider />
          <div
            class="d-flex justify-space-between align-stretch uno-relative">
            <div
              v-if="$vuetify.display.mdAndUp"
              class="d-flex flex-column justify-center align-start mr-auto video-title">
              <template
                v-if="
                  playbackManager.currentlyPlayingType.value ===
                    BaseItemKind.Episode
                ">
                <span class="text-subtitle-1 text-truncate mt-1">
                  {{ playbackManager.currentItem.value?.Name }}
                </span>
                <span class="text--secondary text-truncate text-subtitle-2">
                  {{ playbackManager.currentItem.value?.SeriesName }}
                </span>
                <span class="text-subtitle-2 text--secondary text-truncate">
                  {{
                    $t('seasonEpisode', {
                      seasonNumber:
                        playbackManager.currentItem.value?.ParentIndexNumber,
                      episodeNumber: playbackManager.currentItem.value?.IndexNumber
                    })
                  }}
                </span>
              </template>
              <template v-else>
                <span>{{ playbackManager.currentItem.value?.Name }}</span>
              </template>
              <br>
              <span
                v-if="playbackManager.currentItem.value?.RunTimeTicks"
                class="text-subtitle-2 text--secondary text-truncate">
                {{ getEndsAtTime((playbackManager.currentItem.value?.RunTimeTicks ?? 0) - msToTicks(playbackManager.currentTime.value * 1000)) }}
              </span>
            </div>
            <div
              class="d-flex align-center player-controls justify-start justify-md-center">
              <PreviousTrackButton class="mx-1" />
              <PlayPauseButton class="mx-1" />
              <NextTrackButton class="mx-1" />
            </div>
            <div class="d-flex ml-auto aligh-center ml-md-0">
              <VolumeSlider
                v-if="$vuetify.display.smAndUp"
                class="mr-2" />
              <QueueButton close-on-click />
              <SubtitleSelectionButton
                v-if="$vuetify.display.smAndUp"
                v-model="subtitleSelectionButtonOpened" />
              <PlaybackSettingsButton
                v-model="playbackSettingsButtonOpened" />
              <VBtn
                v-if="mediaControls.supportsPictureInPicture"
                class="align-self-center"
                icon
                @click="mediaControls.togglePictureInPicture">
                <JIcon class="i-mdi:picture-in-picture-bottom-right" />
              </VBtn>
              <JTooltip
                position="top"
                :text="$t('fullScreen')">
                <VBtn
                  v-if="fullscreen.isSupported"
                  class="align-self-center"
                  icon
                  @click="fullscreen.toggle">
                  <JIcon
                    :class="{
                      'i-mdi:fullscreen': !fullscreen.isFullscreen,
                      'i-mdi:fullscreen-exit': fullscreen.isFullscreen
                    }" />
                </VBtn>
              </JTooltip>
            </div>
          </div>
        </div>
      </div>
    </JOverlay>
  </div>
</template>

<route lang="yaml">
meta:
  layout:
    name: fullpage
    transition:
      enter: 'slide-y-reverse'
      leave: 'slide-y'
</route>

<script setup lang="ts">
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client';
import { useTimeoutFn } from '@vueuse/core';
import { computed, shallowRef, watch } from 'vue';
import { playbackGuard } from '#/plugins/router/middlewares/playback';
import {
  mediaControls
} from '#/store';
import { playbackManager } from '#/store/playback-manager';
import { playerElement, videoContainerRef } from '#/store/player-element';
import { getEndsAtTime, msToTicks } from '#/utils/time';
import { usePlayback } from '#/composables/use-playback';

defineOptions({
  beforeRouteEnter: playbackGuard
});

const { fullscreen } = usePlayback();

const osd = shallowRef(true);
const subtitleSelectionButtonOpened = shallowRef(false);
const playbackSettingsButtonOpened = shallowRef(false);
const staticOverlay = computed(
  () =>
    playbackManager.isPaused.value
    || subtitleSelectionButtonOpened.value
    || playbackSettingsButtonOpened.value
);

const overlay = computed({
  get: () => staticOverlay.value || osd.value,
  set: newValue => (osd.value = newValue)
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

watch(staticOverlay, (val) => {
  if (val) {
    timeout.stop();
  } else {
    timeout.start();
  }
});
</script>

<style scoped>
.osd-top,
.osd-bottom {
  width: 100%;
  padding: 8px;
}

.osd-bottom > div,
.osd-top > div {
  max-width: 175vh;
  margin: auto;
}

.osd-top {
  padding-bottom: 5em;
  background: linear-gradient(
    to bottom,
    rgb(var(--j-theme-color-background), 0.75) 0%,
    rgb(var(--j-theme-color-background), 0.74) 8.1%,
    rgb(var(--j-theme-color-background), 0.714) 15.5%,
    rgb(var(--j-theme-color-background), 0.672) 22.5%,
    rgb(var(--j-theme-color-background), 0.618) 29%,
    rgb(var(--j-theme-color-background), 0.556) 35.3%,
    rgb(var(--j-theme-color-background), 0.486) 41.2%,
    rgb(var(--j-theme-color-background), 0.412) 47.1%,
    rgb(var(--j-theme-color-background), 0.338) 52.9%,
    rgb(var(--j-theme-color-background), 0.264) 58.8%,
    rgb(var(--j-theme-color-background), 0.194) 64.7%,
    rgb(var(--j-theme-color-background), 0.132) 71%,
    rgb(var(--j-theme-color-background), 0.078) 77.5%,
    rgb(var(--j-theme-color-background), 0.036) 84.5%,
    rgb(var(--j-theme-color-background), 0.01) 91.9%,
    rgb(var(--j-theme-color-background), 0) 100%
  );
}

.osd-bottom {
  padding-top: 6em;
  background: linear-gradient(
    to top,
    rgb(var(--j-theme-color-background), 0.75) 0%,
    rgb(var(--j-theme-color-background), 0.74) 8.1%,
    rgb(var(--j-theme-color-background), 0.714) 15.5%,
    rgb(var(--j-theme-color-background), 0.672) 22.5%,
    rgb(var(--j-theme-color-background), 0.618) 29%,
    rgb(var(--j-theme-color-background), 0.556) 35.3%,
    rgb(var(--j-theme-color-background), 0.486) 41.2%,
    rgb(var(--j-theme-color-background), 0.412) 47.1%,
    rgb(var(--j-theme-color-background), 0.338) 52.9%,
    rgb(var(--j-theme-color-background), 0.264) 58.8%,
    rgb(var(--j-theme-color-background), 0.194) 64.7%,
    rgb(var(--j-theme-color-background), 0.132) 71%,
    rgb(var(--j-theme-color-background), 0.078) 77.5%,
    rgb(var(--j-theme-color-background), 0.036) 84.5%,
    rgb(var(--j-theme-color-background), 0.01) 91.9%,
    rgb(var(--j-theme-color-background), 0) 100%
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
