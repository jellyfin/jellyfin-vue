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

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
