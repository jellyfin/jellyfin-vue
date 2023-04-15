<template>
  <v-card
    class="identify-result-block"
    variant="outlined"
    @click="$emit('select', item)">
    <poster-block :url="item.ImageUrl ?? undefined" :item-type="itemType" />
    <div class="text-center text-subtitle-1 font-weight-bold mt-2 mx-2">
      {{ item.Name }}
    </div>
    <div
      class="text-center text-body-2 mt-1 mx-2"
      :class="{
        'mb-2': typeof item.ProductionYear !== 'number'
      }">
      {{ item.SearchProviderName }}
    </div>
    <div v-if="item.ProductionYear" class="text-center text-body-2 mb-2 mx-2">
      {{ item.ProductionYear }}
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { RemoteSearchResult } from '@jellyfin/sdk/lib/generated-client';

defineProps<{
  item: RemoteSearchResult;
  itemType?: string;
}>();

defineEmits<{
  (e: 'select', item: RemoteSearchResult): void;
}>();
</script>

<style lang="scss" scoped>
.identify-result-block {
  display: inline-block;
  vertical-align: top;
  justify-items: center;

  $xSpace: 1rem;
  margin-right: $xSpace;
  margin-left: $xSpace;
  margin-bottom: 1rem;

  cursor: pointer;

  /* 2/3 ratio */
  max-width: 220px;
}
</style>
