<template>
  <div :class="large ? useResponsiveClasses('large-grid') : undefined">
    <v-row v-if="loading">
      <v-col cols="12" :class="useResponsiveClasses('card-grid-container')">
        <skeleton-card v-for="n in 24" :key="n" text />
      </v-col>
    </v-row>
    <dynamic-scroller
      v-if="items.length > 0"
      class="scroller"
      :items="itemsChunks"
      :min-item-size="350"
      :buffer="$vuetify.display.height * 1.15"
      page-mode>
      <template #default="{ item, index, active }">
        <dynamic-scroller-item
          :item="item"
          :active="active"
          :data-index="index"
          :class="useResponsiveClasses('card-grid-container')">
          <card
            v-for="card of item.chunk"
            :key="card.Id"
            :item="card"
            margin
            text
            overlay
            link />
        </dynamic-scroller-item>
      </template>
    </dynamic-scroller>
    <v-row v-else-if="!loading" justify="center">
      <v-col
        cols="12"
        :class="
          useResponsiveClasses('card-grid-container empty-card-container')
        ">
        <skeleton-card v-for="n in 24" :key="n" text boilerplate />
      </v-col>
      <div class="empty-message text-center">
        <slot>
          <h1 class="text-h5">
            {{ $t('noResultsFound') }}
          </h1>
        </slot>
      </div>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { chunk } from 'lodash-es';
import { ref, watch } from 'vue';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { useDisplay } from 'vuetify';
import { useResponsiveClasses } from '@/composables';

const display = useDisplay();

const props = defineProps({
  items: {
    type: Array,
    required: true,
    default: (): BaseItemDto[] => {
      return [];
    }
  },
  loading: {
    type: Boolean,
    required: false
  },
  large: {
    type: Boolean,
    required: false
  }
});

const itemsChunks = ref<Array<{ [id: number]: BaseItemDto }>>([]);

watch([display.width, display.height, props.items], () => {
  chunkItems();
});

/**
 * Chunk items for virtual scroller
 */
function chunkItems(): void {
  let cardsPerLine = props.large ? 5 : 8;

  if (display.smAndDown) {
    cardsPerLine = props.large ? 2 : 3;
  } else if (display.smAndUp && !display.lgAndUp) {
    cardsPerLine = props.large ? 3 : 4;
  } else if (display.lgAndUp && !display.xl) {
    cardsPerLine = props.large ? 4 : 6;
  }

  const chunks = chunk(props.items, cardsPerLine);

  itemsChunks.value = chunks.map((itemChunk, index) => {
    return {
      id: index,
      chunk: itemChunk
    };
  });
}
</script>

<style lang="scss" scoped>
.scroller {
  max-height: 100%;
}

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
</style>
