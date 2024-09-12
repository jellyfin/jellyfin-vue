<template>
  <VSelect
    v-model="currentSource"
    :items="selectSources"
    :label="label"
    :single-line="label === undefined"
    hide-details
    class="text-truncate">
    <template #selection="{ item: i }">
      {{ i.value.Name }}
    </template>
    <template #item="{ item: i, props }">
      <VListItem
        v-bind="props"
        :title="i.value.Name" />
    </template>
  </VSelect>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client';
import { getItemizedSelect } from '@/utils/forms';

const { sources, defaultSourceIndex, label } = defineProps<{
  sources: MediaSourceInfo[];
  defaultSourceIndex?: number;
  label?: string;
}>();

const emit = defineEmits<{
  input: [newIndex: number];
}>();

const currentSource = ref(
  sources[defaultSourceIndex ?? 0]
);
const selectSources = computed(() => getItemizedSelect(sources));

watch(currentSource, () => {
  const newIndex = sources.findIndex(
    s => s.Id === currentSource.value.Id
  );

  emit('input', newIndex);
});
</script>
