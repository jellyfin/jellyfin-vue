<template>
  <VRow>
    <VCol
      cols="12"
      :class="useResponsiveClasses('card-grid-container')">
      <SkeletonCard
        v-for="n in 24"
        :key="n"
        :card-shape="skeletonCardShape"
        text />
    </VCol>
  </VRow>
</template>

<script setup lang="ts">
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client';
import { computed } from 'vue';
import { useResponsiveClasses } from '#/composables/use-responsive-classes';
import { getShapeFromItemType } from '#/utils/items';

const { viewType = BaseItemKind.Movie } = defineProps<{ viewType?: BaseItemKind }>();

const skeletonCardShape = computed(() => {
  return getShapeFromItemType(viewType);
});
</script>

<style scoped>
.card-grid-container {
  display: grid;
}

.card-grid-container.sm-and-down {
  grid-template-columns: repeat(3, minmax(calc(100% / 3), 1fr));
}

.card-grid-container.sm-and-up {
  grid-template-columns: repeat(4, minmax(calc(100% / 4), 1fr));
}

.card-grid-container.lg-and-up {
  grid-template-columns: repeat(6, minmax(calc(100% / 6), 1fr));
}

.card-grid-container.xl {
  grid-template-columns: repeat(8, minmax(calc(100% / 8), 1fr));
}
</style>
