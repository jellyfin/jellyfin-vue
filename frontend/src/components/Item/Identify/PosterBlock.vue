<template>
  <div
    :class="{
      'thumb-card': shape === CardShapes.Thumb || shape == CardShapes.Banner,
      'portrait-card': shape === CardShapes.Portrait,
      'square-card': shape === CardShapes.Square
    }">
    <div class="h-auto w-100">
      <v-img :src="url" alt="Poster Image" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client';
import { CardShapes, getShapeFromItemType } from '@/utils/items';

const props = defineProps<{ url?: string; itemType?: BaseItemKind }>();

const shape = computed(() => getShapeFromItemType(props.itemType ?? undefined));
</script>
