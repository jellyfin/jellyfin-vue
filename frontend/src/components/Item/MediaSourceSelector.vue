<template>
  <VSelect
    v-model="currentSource"
    :items="selectSources"
    :label="selectProps.label"
    :single-line="selectProps.label == undefined"
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

const selectProps = defineProps<{
  sources: MediaSourceInfo[];
  defaultSourceIndex?: number;
  label?: string;
}>();

const emits = defineEmits<{
  input: [newIndex: number];
}>();

const currentSource = ref(
  selectProps.sources[selectProps.defaultSourceIndex ?? 0]
);
const selectSources = computed(() => getItemizedSelect(selectProps.sources));

watch(currentSource, () => {
  const newIndex = selectProps.sources.findIndex(
    (s) => s.Id === currentSource.value.Id
  );

  emits('input', newIndex);
});
</script>
