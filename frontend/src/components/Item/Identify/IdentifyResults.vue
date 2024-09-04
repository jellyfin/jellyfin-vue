<template>
  <VRow dense>
    <VCol
      v-for="(item, idx) in items"
      :key="idx"
      :cols="2">
      <GenericItemCard
        :shape="shape"
        margin
        @click="$emit('select', item)">
        <template #image>
          <JImg
            :src="item.ImageUrl"
            :alt="item.Name ?? $t('imageSearchResult')"
            once>
            <VIcon>
              <IMdiImage />
            </VIcon>
          </JImg>
        </template>
        <template #title>
          {{ item.Name }}
        </template>
        <template #subtitle>
          {{ getSubtitle(item) }}
        </template>
      </GenericItemCard>
    </VCol>
  </VRow>
</template>

<script setup lang="ts">
import type {
  BaseItemKind,
  RemoteSearchResult
} from '@jellyfin/sdk/lib/generated-client';
import { computed } from 'vue';
import { getShapeFromItemType } from '@/utils/items';

const { items, itemType } = defineProps<{
  items: RemoteSearchResult[];
  itemType?: BaseItemKind;
}>();

defineEmits<{
  select: [item: RemoteSearchResult];
}>();

const shape = computed(() => getShapeFromItemType(itemType));

/**
 * Generate card's subtitles
 */
function getSubtitle(item: RemoteSearchResult): string | undefined {
  const yearString = item.ProductionYear
    ? String(item.ProductionYear)
    : undefined;
  const value
    = yearString && item.SearchProviderName
      ? `${yearString} - ${item.SearchProviderName}`
      : yearString ?? item.SearchProviderName;

  return value ?? undefined;
}
</script>
