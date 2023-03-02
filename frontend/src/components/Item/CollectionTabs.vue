<template>
  <div v-if="children">
    <v-tabs v-model="currentTab" class="mb-3" bg-color="transparent">
      <v-tab v-for="(baseItems, type) in children" :key="type" :value="type">
        {{ type }} ({{ baseItems.length }})
      </v-tab>
    </v-tabs>
    <h1 v-if="!children && !loading" class="text-h5 text-center">
      {{ $t('collectionEmpty') }}
    </h1>
    <v-window v-model="currentTab" class="bg-transparent">
      <v-window-item
        v-for="(baseItems, type) in children"
        :key="type"
        :value="type">
        <v-container>
          <skeleton-item-grid v-if="loading" :view-type="item.Type" />
          <item-grid :loading="loading" :items="baseItems" />
        </v-container>
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup lang="ts">
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { groupBy } from 'lodash-es';
import { computed, ref, watch } from 'vue';
import { itemsStore } from '@/store';

const items = itemsStore();

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
