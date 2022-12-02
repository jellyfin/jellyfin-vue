<template>
  <v-app>
    <backdrop />
    <navigation-drawer />
    <app-bar />
    <v-main>
      <div class="pa-s">
        <router-view-transition />
      </div>
    </v-main>
    <audio-controls />
  </v-app>
</template>

<script setup lang="ts">
import { ref, watch, provide } from 'vue';
import { useDisplay } from 'vuetify';

const display = useDisplay();
const navDrawer = ref(true);

watch(display.mobile, () => {
  navDrawer.value = !display.mobile;
});

provide('NavigationDrawer', navDrawer);
</script>
