<template>
  <VListItem
    v-if="commit_hash"
    :title="'#' + commit_hash.slice(0, 7)"
    :href="link"
    target="_blank"
    rel="noopener noreferrer">
    <template #prepend>
      <JIcon
        class="i-mdi:github uno-w-10" />
    </template>
  </VListItem>
</template>

<script setup lang="ts">
import { commit_hash } from 'virtual:commit';
import { sanitizeHtml } from '@jellyfin-vue/shared/html';

const link = commit_hash ? sanitizeHtml(`https://github.com/jellyfin/jellyfin-vue/commit/${commit_hash}`) : undefined;
</script>
