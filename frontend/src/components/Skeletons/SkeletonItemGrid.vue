<template>
  <v-row>
    <v-col cols="12" :class="useResponsiveClasses('card-grid-container')">
      <skeleton-card
        v-for="n in 24"
        :key="n"
        :card-shape="skeletonCardShape"
        text />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { CardShapes, getShapeFromItemType } from '@/utils/items';
import { useResponsiveClasses } from '@/composables';

const props = withDefaults(defineProps<{ viewType?: string }>(), {
  viewType: 'Movie'
});

const skeletonCardShape = computed(() => {
  return getShapeFromItemType(props.viewType) || CardShapes.Portrait;
});
</script>

<style lang="scss" scoped>
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
