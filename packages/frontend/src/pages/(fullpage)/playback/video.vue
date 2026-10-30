<template>
  <div
    ref="videoContainerRef"
    class="fill-height uno-bg-player uno-flex uno-justify-center !uno-h-screen"
    :class="{ 'uno-cursor-none': !overlay }"
    @mousemove.passive="handleMouseMove"
    @touchend.passive="handleMouseMove">
    <JOverlay
      class="uno-flex uno-flex-col uno-h-full uno-items-center uno-justify-between"
      :class="{
        'uno-opacity-100': overlay,
        'uno-opacity-0': !overlay
      }">
      <div class="uno-pb-[5em] uno-pl-[max(8px,env(safe-area-inset-left))] uno-pr-[max(8px,env(safe-area-inset-right))] uno-pt-[max(8px,env(safe-area-inset-top))] uno-w-full uno-bg-scrim-to-b-background/75">
        <div class="uno-m-auto uno-px-4 uno-py-2 uno-flex uno-max-w-[175vh] uno-items-center">
          <div class="uno-flex">
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
          <div class="uno-ml-auto uno-flex">
            <CastButton />
          </div>
        </div>
      </div>
      <div class="uno-pb-[max(8px,env(safe-area-inset-bottom))] uno-pl-[max(8px,env(safe-area-inset-left))] uno-pr-[max(8px,env(safe-area-inset-right))] uno-pt-[6em] uno-w-full uno-bg-scrim-to-t-background/75">
        <div class="uno-m-auto uno-p-4 uno-max-w-[175vh]">
          <TimeSlider />
          <div
            class="uno-flex uno-items-stretch uno-justify-between uno-relative">
            <div
              v-if="$vuetify.display.mdAndUp"
              class="uno-mr-auto uno-flex uno-flex-col uno-h-[6em] uno-max-w-[40vw] uno-items-start uno-justify-center">
              <template
                v-if="
                  playbackManager.currentlyPlayingType.value ===
                    BaseItemKind.Episode
                ">
                <span class="text-subtitle-1 uno-mt-1 uno-truncate">
                  {{ playbackManager.currentItem.value?.Name }}
                </span>
                <span class="text--secondary text-subtitle-2 uno-truncate">
                  {{ playbackManager.currentItem.value?.SeriesName }}
                </span>
                <span class="text-subtitle-2 text--secondary uno-truncate">
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
                class="text-subtitle-2 text--secondary uno-truncate">
                {{ getEndsAtTime((playbackManager.currentItem.value?.RunTimeTicks ?? 0) - msToTicks(playbackManager.currentTime.value * 1000)) }}
              </span>
            </div>
            <div
              class="justify-md-center uno-flex uno-size-full uno-items-center uno-left-0 uno-top-0 uno-justify-start uno-absolute">
              <PreviousTrackButton class="uno-mx-1" />
              <PlayPauseButton class="uno-mx-1" />
              <NextTrackButton class="uno-mx-1" />
            </div>
            <div class="ml-md-0 uno-ml-auto uno-flex uno-items-center">
              <VolumeSlider
                v-if="$vuetify.display.smAndUp"
                class="uno-mr-2" />
              <QueueButton close-on-click />
              <SubtitleSelectionButton
                v-if="$vuetify.display.smAndUp"
                v-model="subtitleSelectionButtonOpened" />
              <PlaybackSettingsButton
                v-model="playbackSettingsButtonOpened" />
              <VBtn
                v-if="mediaControls.supportsPictureInPicture"
                class="uno-self-center"
                icon
                @click="mediaControls.togglePictureInPicture">
                <JIcon class="i-mdi:picture-in-picture-bottom-right" />
              </VBtn>
              <JTooltip
                position="top"
                :text="$t('fullScreen')">
                <VBtn
                  v-if="fullscreen.isSupported"
                  class="uno-self-center"
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

<script setup lang="ts">
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client';
import { useTimeoutFn } from '@vueuse/core';
import { computed, shallowRef, watch } from 'vue';
import { playbackGuard } from '#/plugins/router/middlewares/playback.ts';
import {
  mediaControls
} from '#/store/index.ts';
import { playbackManager } from '#/store/playback-manager.ts';
import { playerElement, videoContainerRef } from '#/store/player-element.ts';
import { getEndsAtTime, msToTicks } from '#/utils/time.ts';
import { usePlayback } from '#/composables/use-playback.ts';

definePage({
  beforeEnter: playbackGuard,
  meta: {
    layout: {
      transition: {
        enter: 'slide-y-reverse',
        leave: 'slide-y'
      }
    }
  }
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
