<template>
  <router-view-transition is-root />
  <snackbar />
  <player-manager />
</template>

<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core';
import { watch } from 'vue';

const { x, y } = useWindowScroll();
</script>
