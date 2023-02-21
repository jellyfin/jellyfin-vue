<template>
  <app-bar />
  <navigation-drawer :order="display.mobile.value ? -1 : undefined" />
  <v-main>
    <div class="pa-s">
      <router-view-transition />
    </div>
  </v-main>
  <audio-controls />
</template>

<script setup lang="ts">
import { ref, watch, provide } from 'vue';
import { useDisplay } from 'vuetify';
import { userLibrariesStore } from '@/store';

const display = useDisplay();
const userLibraries = userLibrariesStore();
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
</script>
