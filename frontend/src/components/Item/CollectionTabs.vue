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
        {{ type }} ({{ baseItems?.length ?? '' }})
      </VTab>
    </VTabs>
    <h1
      v-if="!children"
      class="text-center text-h5">
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
            :items="baseItems ?? []" />
        </VContainer>
      </VWindowItem>
    </VWindow>
  </div>
</template>

<script setup lang="ts">
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { computed, shallowRef } from 'vue';

const { items } = defineProps<{
  items: BaseItemDto[];
}>();

const currentTab = shallowRef(0);
const children = computed(() => Object.groupBy(items, ({ Type }) => Type!));
</script>
