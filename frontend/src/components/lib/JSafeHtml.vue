<template>
  <span v-html="sanitizeHtml(html, markdown)" />
</template>

<script setup lang="ts">
import { sanitizeHtml } from '@/utils/html';

defineOptions({
  inheritAttrs: false
});

defineProps<{
  html: string
  markdown?: boolean
}>();
</script>
