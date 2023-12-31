<template>
  <AppBar />
  <NavigationDrawer :order="display.mobile.value ? -1 : undefined" />
  <VMain>
    <div class="pa-s">
      <PageView />
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
import { playbackManager } from '@/store/playbackManager';
import { playerElement } from '@/store/playerElement';
import { userLibraries } from '@/store/userLibraries';
import { onBeforeMount, onUnmounted, provide, ref, watch } from 'vue';
import { useDisplay } from 'vuetify';

const display = useDisplay();
const navDrawer = ref(!display.mobile.value);

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
