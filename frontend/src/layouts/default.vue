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

if (!userLibraries.isReady) {
  // Loading recent items from libraries can take a long time from server. To improve UX, we block navigation to the default layout when loading the client, so all the content is present when the page is finally rendered, avoiding content jumping.
  await userLibraries.refresh();
}

watch(display.mobile, () => {
  navDrawer.value = !display.mobile;
});

provide('NavigationDrawer', navDrawer);
</script>
