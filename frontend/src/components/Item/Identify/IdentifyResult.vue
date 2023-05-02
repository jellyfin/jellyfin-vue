<template>
  <v-card
    class="identify-result-block"
    variant="outlined"
    @click="$emit('select', item)">
    <poster-block :url="item.ImageUrl ?? undefined" :item-type="itemType" />
    <div class="text-center text-subtitle-1 font-weight-bold mt-2 mx-2">
      {{ item.Name }}
    </div>
    <div class="text-center text-body-2 mt-1 mx-2">
      {{ item.SearchProviderName }}
    </div>
    <div v-if="item.ProductionYear" class="text-center text-body-2 my-2 mx-2">
      {{ item.ProductionYear }}
    </div>
  </v-card>
</template>

<script setup lang="ts">
import {
  BaseItemKind,
  RemoteSearchResult
} from '@jellyfin/sdk/lib/generated-client';

defineProps<{
  item: RemoteSearchResult;
  itemType?: BaseItemKind;
}>();

defineEmits<{
  (e: 'select', item: RemoteSearchResult): void;
}>();
</script>

<style lang="scss" scoped>
.identify-result-block {
  display: flex;
  flex-direction: column;
  vertical-align: top;
  justify-items: center;

  $xSpace: 1rem;
  margin-right: $xSpace;
  margin-left: $xSpace;
  margin-bottom: 1rem;

  cursor: pointer;

  /* 220px width */
  width: 13.75rem;
  max-width: 13.75rem;
}
</style>
