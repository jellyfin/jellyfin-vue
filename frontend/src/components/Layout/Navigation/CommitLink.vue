<template>
  <v-list-item
    v-if="commit"
    :title="'#' + commit.slice(0, 7)"
    :prepend-icon="IMdiGithub"
    :href="url"
    target="_blank"
    rel="noopener noreferrer" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import IMdiGithub from 'virtual:icons/mdi/github';

const commit = __COMMIT_HASH__;

const url = computed(() => {
  return `https://github.com/jellyfin/jellyfin-vue/commit/${commit}`;
});
</script>
