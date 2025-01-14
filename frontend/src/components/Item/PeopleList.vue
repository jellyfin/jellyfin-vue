<template>
  <VList
    bg-color="transparent"
    lines="two">
    <div v-if="items.length">
      <VListItem
        v-for="(item, index) in items"
        :key="`${item.Id}-${index}`"
        :title="item.Name || ''"
        :subtitle="item.Role || item.Type || ''"
        :to="getItemDetailsLink(item, 'Person')">
        <template #prepend>
          <VAvatar color="card">
            <BlurhashImage :item="item" />
          </VAvatar>
        </template>
      </VListItem>
    </div>
    <div
      v-for="index in skeletonLength ?? 0"
      v-else
      :key="index"
      class="d-flex align-center mt-5 mb-5">
      <VSkeletonLoader
        type="avatar"
        class="ml-3 mr-3" />
      <VSkeletonLoader
        type="sentences"
        width="10em"
        class="pr-5" />
    </div>
  </VList>
</template>

<script setup lang="ts">
import type { BaseItemPerson } from '@jellyfin/sdk/lib/generated-client';
import { getItemDetailsLink } from '@/utils/items';

const { items, skeletonLength } = defineProps<{
  items: BaseItemPerson[];
  skeletonLength?: number;
}>();
</script>
