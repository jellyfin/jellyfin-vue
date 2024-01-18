<template>
  <VRow dense>
    <VCol
      v-for="(item, idx) in items"
      :key="idx"
      :cols="2">
      <VCard
        variant="tonal"
        class="flex-grow-0 h-100"
        :class="cardClass"
        @click="$emit('select', item)">
        <VTooltip location="top">
          {{ item.Name }}
        </VTooltip>
        <JHover v-slot="{ isHovering, hoverProps }">
          <VImg
            :src="item.ImageUrl ?? undefined"
            v-bind="hoverProps"
            aspect-ratio="0.75"
            cover
            :gradient="
              isHovering ? undefined : 'to bottom, rgba(0,0,0,1), rgba(0,0,0,0)'
            "
            class="absolute-cover">
            <template #placeholder>
              <div class="d-flex justify-center align-center h-100">
                <VProgressCircular
                  v-if="item.ImageUrl"
                  indeterminate />
                <VIcon v-else>
                  <IMdiImageBrokenVariant />
                </VIcon>
              </div>
            </template>
            <VFadeTransition group>
              <VCardTitle v-if="!isHovering">
                {{ item.Name }}
              </VCardTitle>
              <VCardSubtitle v-if="!isHovering && getSubtitle(item)">
                {{ getSubtitle(item) }}
              </VCardSubtitle>
            </VFadeTransition>
          </VImg>
        </JHover>
      </VCard>
    </VCol>
  </VRow>
</template>

<script setup lang="ts">
import type {
  BaseItemKind,
  RemoteSearchResult
} from '@jellyfin/sdk/lib/generated-client';
import { computed } from 'vue';
import { CardShapes, getShapeFromItemType } from '@/utils/items';

const props = defineProps<{
  items: RemoteSearchResult[];
  itemType?: BaseItemKind;
}>();

defineEmits<{
  select: [item: RemoteSearchResult];
}>();

const shape = computed(() => getShapeFromItemType(props.itemType));
const cardClass = computed<
'thumb-card' | 'portrait-card' | 'square-card' | undefined
>(() => {
  switch (shape.value) {
    case CardShapes.Thumb:
    case CardShapes.Banner: {
      return 'thumb-card';
    }
    case CardShapes.Portrait: {
      return 'portrait-card';
    }
    case CardShapes.Square: {
      return 'square-card';
    }
  }
});

/**
 * Generate card's subtitles
 */
function getSubtitle(item: RemoteSearchResult): string | undefined {
  const yearString = item.ProductionYear
    ? String(item.ProductionYear)
    : undefined;
  const value =
    yearString && item.SearchProviderName
      ? `${yearString} - ${item.SearchProviderName}`
      : yearString ?? item.SearchProviderName;

  return value ?? undefined;
}
</script>
