<template>
  <v-list bg-color="transparent" lines="two">
    <div v-if="items.length > 0">
      <v-list-item
        v-for="(item, index) in items"
        :key="`${item.Id}-${index}`"
        :title="item.Name || ''"
        :subtitle="item.Role || item.Type || ''"
        :to="getItemDetailsLink(item, 'Person')">
        <template #prepend>
          <v-avatar color="card">
            <blurhash-image :item="item" />
          </v-avatar>
        </template>
      </v-list-item>
    </div>
    <div
      v-for="index in skeletonLength"
      v-else
      :key="index"
      class="d-flex align-center mt-5 mb-5">
      <!-- TODO: Wait for Vuetify 3.1 -->
      <!-- <v-skeleton-loader type="avatar" class="ml-3 mr-3" />
      <v-skeleton-loader type="sentences" width="10em" class="pr-5" /> -->
    </div>
  </v-list>
</template>

<script setup lang="ts">
import { BaseItemPerson } from '@jellyfin/sdk/lib/generated-client';
import { getItemDetailsLink } from '@/utils/items';

withDefaults(
  defineProps<{
    items?: BaseItemPerson[];
    skeletonLength?: number;
  }>(),
  { items: () => [], skeletonLength: 0 }
);
</script>
