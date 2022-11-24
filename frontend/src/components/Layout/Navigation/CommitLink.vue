<template>
  <v-list-item
    v-if="commit"
    :href="url"
    target="_blank"
    rel="noopener noreferrer">
    <v-list-item-action>
      <i-mdi-github />
    </v-list-item-action>
    <v-list-item-title>
      {{ '#' + commit.substring(0, 7) }}
    </v-list-item-title>
  </v-list-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const commit = __COMMIT_HASH__;

const url = computed(() => {
  return `https://github.com/jellyfin/jellyfin-vue/commit/${commit}`;
});
</script>
