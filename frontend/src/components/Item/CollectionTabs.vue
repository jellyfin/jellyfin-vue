<template>
  <div v-if="children">
    <VTabs
      v-model="currentTab"
      class="mb-3"
      bg-color="transparent">
      <VTab
        v-for="(baseItems, type) in children"
        :key="type"
        :value="type">
        {{ type }} ({{ baseItems.length }})
      </VTab>
    </VTabs>
    <h1
      v-if="!children"
      class="text-h5 text-center">
      {{ $t('collectionEmpty') }}
    </h1>
    <VWindow
      v-model="currentTab"
      class="bg-transparent">
      <VWindowItem
        v-for="(baseItems, type) in children"
        :key="type"
        :value="type">
        <VContainer>
          <!-- <SkeletonItemGrid
            v-if="loading"
            :view-type="item.Type" /> -->
          <ItemGrid
            :items="baseItems" />
        </VContainer>
      </VWindowItem>
    </VWindow>
  </div>
</template>

<script setup lang="ts">
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { groupBy } from 'lodash-es';
import { computed, ref } from 'vue';

const props = defineProps<{
  items: BaseItemDto[];
}>();

const currentTab = ref(0);
const children = computed(() => {
  return groupBy(props.items, 'Type');
});
</script>
