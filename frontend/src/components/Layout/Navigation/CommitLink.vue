<template>
  <VListItem
    v-if="commit"
    :title="'#' + commit.slice(0, 7)"
    :prepend-icon="IMdiGithub"
    :href="sanitizeHtml(`https://github.com/jellyfin/jellyfin-vue/commit/${commit}`)"
    target="_blank"
    rel="noopener noreferrer" />
</template>

<script setup lang="ts">
import IMdiGithub from 'virtual:icons/mdi/github';
import { sanitizeHtml } from '@/utils/html';

const commit = __COMMIT_HASH__;
</script>
