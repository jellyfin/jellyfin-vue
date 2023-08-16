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
import { computed } from 'vue';
import IMdiCheck from 'virtual:icons/mdi/check';
import IMdiClose from 'virtual:icons/mdi/close';
import IMdiHelp from 'virtual:icons/mdi/help';

const props = defineProps<{
  name: string;
  value?: string | number | boolean;
}>();

const icon = computed(() => {
  if (typeof props.value === 'boolean') {
    return props.value ? IMdiCheck : IMdiClose;
  }

  return props.value === 'undefined' ? IMdiHelp : undefined;
});
</script>
