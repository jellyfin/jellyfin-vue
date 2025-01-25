<template>
  <div :class="large ? useResponsiveClasses('large-grid') : undefined">
    <template v-if="items.length">
      <JVirtual
        v-if="!noVirtual"
        v-slot="{ item }"
        :items="items"
        grid
        index-as-key
        :class="useResponsiveClasses('card-grid-container')">
        <ItemCard
          :item="item"

          link
          margin
          text
          overlay />
      </JVirtual>
      <div
        v-else
        :class="useResponsiveClasses('card-grid-container')">
        <template
          v-for="item of items"
          :key="item.Id">
          <ItemCard
            :item="item"
            margin
            text
            overlay
            link />
        </template>
      </div>
    </template>
    <VRow
      v-else
      justify="center">
      <VCol
        cols="12"
        :class="
          useResponsiveClasses('card-grid-container empty-card-container')
        ">
        <SkeletonCard
          v-for="n in 24"
          :key="n"
          text
          boilerplate />
      </VCol>
      <div class="text-center empty-message">
        <slot>
          <h1 class="text-h5">
            {{ $t('noResultsFound') }}
          </h1>
        </slot>
      </div>
    </VRow>
  </div>
</template>

<script setup lang="ts">
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { useResponsiveClasses } from '#/composables/use-responsive-classes';

const { items, large, noVirtual } = defineProps<{
  items: BaseItemDto[];
  large?: boolean;
  noVirtual?: boolean;
}>();
</script>

<style scoped>
.empty-card-container {
  max-height: 90vh;
  overflow: hidden;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0));
}

.empty-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.card-grid-container {
  display: grid;
}

.card-grid-container.sm-and-down {
  grid-template-columns: repeat(3, minmax(calc(100% / 3), 1fr));
}

.large-grid.sm-and-down .card-grid-container.sm-and-down {
  grid-template-columns: repeat(2, minmax(calc(100% / 2), 1fr));
}

.card-grid-container.sm-and-up {
  grid-template-columns: repeat(4, minmax(calc(100% / 4), 1fr));
}

.large-grid.sm-and-up .card-grid-container.sm-and-up {
  grid-template-columns: repeat(3, minmax(calc(100% / 3), 1fr));
}

.card-grid-container.lg-and-up {
  grid-template-columns: repeat(6, minmax(calc(100% / 6), 1fr));
}

.large-grid.lg-and-up .card-grid-container.lg-and-up {
  grid-template-columns: repeat(4, minmax(calc(100% / 4), 1fr));
}

.card-grid-container.xl {
  grid-template-columns: repeat(8, minmax(calc(100% / 8), 1fr));
}

.large-grid.xl .card-grid-container.xl {
  grid-template-columns: repeat(5, minmax(calc(100% / 5), 1fr));
}

.card-grid-container.xxl {
  grid-template-columns: repeat(12, minmax(calc(100% / 12), 1fr));
}

.large-grid.xxl .card-grid-container.xxl {
  grid-template-columns: repeat(6, minmax(calc(100% / 6), 1fr));
}
</style>
