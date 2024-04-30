<template>
  <div class="j-splash" :class="clientSettings.currentTheme.value">
    <div class="logo"/>
  </div>
</template>

<script setup lang="ts">
import { clientSettings } from '@/store/client-settings';
</script>
