<template>
  <div class="poster-block" title="Poster Image">
    <div
      class="img-contain"
      :class="{
        'square-m': shape === CardShapes.Square,
        'portrait-m': shape === CardShapes.Portrait,
        'thumb-m': shape === CardShapes.Thumb || shape === CardShapes.Banner
      }">
      <div
        class="d-flex justify-center align-center img-poster"
        :style="{
          backgroundImage: url ? `url(${url})` : undefined
        }" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client';
import { CardShapes, getShapeFromItemType } from '@/utils/items';

const props = defineProps<{ url?: string; itemType?: string }>();

const shape = computed(() =>
  getShapeFromItemType((props.itemType as BaseItemKind) ?? undefined)
);
</script>

<style lang="scss" scoped>
$maxW: 220px;

.poster-block {
  contain: layout style;
  position: relative;

  > .img-contain {
    width: 100%;
    display: block;
    cursor: pointer;

    > .img-poster {
      contain: strict;
      height: 100%;
      width: 100%;
      background-position: 50%;
      background-size: cover;
      background-clip: content-box;
      background-repeat: no-repeat;
      position: relative;
    }
  }
}

.square-m {
  $ar: 1;

  aspect-ratio: $ar;
  max-height: calc($maxW / $ar);
  height: calc($maxW / $ar);
}

.portrait-m {
  $ar: calc(2 / 3);

  aspect-ratio: $ar;
  max-height: calc($maxW / $ar);
  height: calc($maxW / $ar);
}

.thumb-m {
  $ar: calc(16 / 9);

  aspect-ratio: $ar;
  max-height: calc($maxW / $ar);
  height: calc($maxW / $ar);
}
</style>
