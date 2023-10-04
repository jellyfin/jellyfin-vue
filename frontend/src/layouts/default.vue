<template>
  <AppBar />
  <NavigationDrawer :order="display.mobile.value ? -1 : undefined" />
  <VMain>
    <div class="pa-s">
      <RouterViewTransition />
    </div>
  </VMain>
  <AudioControls />
  <PiPVideoPlayer
    v-if="
      playbackManager.currentlyPlayingMediaType === 'Video' &&
        !playerElement.isFullscreenVideoPlayer
    " />
</template>

<script setup lang="ts">
import { ref, watch, provide, onBeforeMount, onUnmounted } from 'vue';
import { useDisplay } from 'vuetify';
import {
  playbackManagerStore,
  playerElementStore,
  userLibrariesStore,
  userItemsStore
} from '@/store';

const display = useDisplay();
const userLibraries = userLibrariesStore();
const userItems = userItemsStore();
const navDrawer = ref(!display.mobile.value);

const playbackManager = playbackManagerStore();
const playerElement = playerElementStore();

/**
 * We block the navigation to the layout at login to improve UX, so content doesn't pop up or jumps while rendering the page.
 * The data fetched at logon is used for the entire lifecycle of the user session. Changing layouts
 * (which happens when going to the fullscreen playback pages, for example) and going back to this one doesn't block the navigation again,
 * since 'isReady' will be only set to false again at user logout.
 *
 * For the rest of the user's session lifecycle, data will be refetched when the user navigates to index.
 * Refer to the documentation added to the pages/index.vue for more information
 */
if (!userLibraries.isReady) {
  await userLibraries.refresh();
}

if (!userItems.isReady) {
  await userItems.refresh();
}

watch(display.mobile, () => {
  navDrawer.value = !display.mobile;
});

provide('NavigationDrawer', navDrawer);
onBeforeMount(() => {
  document.documentElement.classList.remove('no-forced-scrollbar');
});
onUnmounted(() => {
  document.documentElement.classList.add('no-forced-scrollbar');
});
</script>
