<template>
  <v-app :theme="store.state.clientSettings.darkMode ? 'dark' : 'light'">
    <!-- <backdrop /> -->
    <router-view />
    <!-- <audio-controls /> -->
    <!-- <snackbar /> -->
    <!-- <player-manager /> -->
  </v-app>
</template>

<script setup lang="ts">
import { useStore } from './store';

const store = useStore();
</script>
