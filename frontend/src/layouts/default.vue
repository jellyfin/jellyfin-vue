<template>
  <app-bar />
  <navigation-drawer />
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
const navDrawer = ref(true);

if (!userLibraries.isReady) {
  await userLibraries.refresh();
}

watch(display.mobile, () => {
  navDrawer.value = !display.mobile;
});

provide('NavigationDrawer', navDrawer);
</script>
