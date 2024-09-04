<template>
  <p>
    <b>{{ `${name}: ` }}</b>
    <template v-if="!icon">
      {{ value }}
    </template>
    <VIcon
      v-else
      :icon="icon" />
  </p>
</template>

<script setup lang="ts">
import IMdiCheck from 'virtual:icons/mdi/check';
import IMdiClose from 'virtual:icons/mdi/close';
import IMdiHelp from 'virtual:icons/mdi/help';
import { computed } from 'vue';
import { isBool } from '@/utils/validation';

const { name, value } = defineProps<{
  name: string;
  value?: string | number | boolean;
}>();

const icon = computed(() => {
  if (isBool(value)) {
    return value ? IMdiCheck : IMdiClose;
  }

  return value === 'undefined' ? IMdiHelp : undefined;
});
</script>
