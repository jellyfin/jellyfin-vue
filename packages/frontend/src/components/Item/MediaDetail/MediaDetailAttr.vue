<template>
  <p>
    <b>{{ `${name}: ` }}</b>
    <template v-if="!icon">
      {{ value }}
    </template>
    <JIcon
      v-else
      :class="icon" />
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { isBool } from '@jellyfin-vue/shared/validation';

const { name, value } = defineProps<{
  name: string;
  value?: string | number | boolean;
}>();

const icon = computed(() => {
  if (isBool(value)) {
    return value ? 'i-mdi:check' : 'i-mdi:close';
  }

  return value === 'undefined' ? 'i-mdi:help' : undefined;
});
</script>
