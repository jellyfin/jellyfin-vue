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
      v-if="!children && !loading"
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
          <SkeletonItemGrid
            v-if="loading"
            :view-type="item.Type" />
          <ItemGrid
            :loading="loading"
            :items="baseItems" />
        </VContainer>
      </VWindowItem>
    </VWindow>
  </div>
</template>

<script setup lang="ts">
import { items } from '@/store/items';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { groupBy } from 'lodash-es';
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  item: BaseItemDto;
}>();

const currentTab = ref(0);
const loading = ref(false);
const children = computed(() => {
  return groupBy(items.getChildrenOfParent(props.item.Id), 'Type');
});

watch(
  () => props.item,
  async (item) => {
    /**
     * Only try to load children if there aren't any children items in the itemStore yet
     */
    if (children.value) {
      return;
    }

    loading.value = true;
    await items.fetchAndAddCollection(item.Id);
    loading.value = false;
  },
  { immediate: true }
);
</script>
