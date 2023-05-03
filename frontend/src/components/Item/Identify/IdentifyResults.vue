<template>
  <v-row dense>
    <v-col v-for="(item, idx) in items" :key="idx" :cols="2">
      <v-card
        variant="tonal"
        class="flex-grow-0 h-100"
        :class="cardClass"
        @click="$emit('select', item)">
        <v-tooltip location="top">
          {{ item.Name }}
        </v-tooltip>
        <v-hover v-slot="{ isHovering, props: hoverProps }">
          <v-img
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
                <v-progress-circular v-if="item.ImageUrl" indeterminate />
                <v-icon v-else>
                  <i-mdi-image-broken-variant />
                </v-icon>
              </div>
            </template>
            <v-fade-transition group>
              <v-card-title v-if="!isHovering">
                {{ item.Name }}
              </v-card-title>
              <v-card-subtitle v-if="!isHovering && getSubtitle(item)">
                {{ getSubtitle(item) }}
              </v-card-subtitle>
            </v-fade-transition>
          </v-img>
        </v-hover>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import {
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
  (e: 'select', item: RemoteSearchResult): void;
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
