<template>
  <VSelect
    :model-value="currentSource"
    :items="selectSources"
    :label="label"
    :single-line="isNil(label)"
    hide-details
    class="text-truncate"
    @update:model-value="onSelect">
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
import { computed } from 'vue';
import type { MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client';
import { isNil } from '@jellyfin-vue/shared/validation';
import { getItemizedSelect } from '#/utils/forms.ts';

const { sources, defaultSourceIndex, label } = defineProps<{
  sources: MediaSourceInfo[];
  /**
   * The version shown: the one the user picked or, while none is picked, the one played when none is chosen. The
   * parent owns the pick (it knows when it stops applying, like when the item changes), so a pick is shown only once
   * the parent passes it back. It may change at any time, and the selector follows it.
   */
  defaultSourceIndex?: number;
  label?: string;
}>();

const emit = defineEmits<{
  /**
   * Index (in `sources`) of the version picked by the user. Only emitted on user picks.
   */
  input: [newIndex: number];
}>();

const currentSource = computed(() => sources[defaultSourceIndex ?? 0]);
const selectSources = computed(() => getItemizedSelect(sources));

/**
 * Handles the user picking a version: the parent keeps it and passes it back as `defaultSourceIndex`
 */
function onSelect(source: MediaSourceInfo | null | undefined): void {
  if (!source || source.Id === currentSource.value?.Id) {
    return;
  }

  emit('input', sources.findIndex(s => s.Id === source.Id));
}
</script>
