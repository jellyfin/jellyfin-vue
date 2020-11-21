<template>
  <div>
    <v-row v-if="loading">
      <v-col cols="12" class="card-grid-container">
        <skeleton-card v-for="n in 24" :key="n" />
      </v-col>
    </v-row>
    <dynamic-scroller
      v-if="items.length"
      class="scroller"
      :items="itemsChunks"
      :min-item-size="350"
      :buffer="$vuetify.breakpoint.height * 1.5"
      page-mode
    >
      <template #default="{ item, index, active }">
        <dynamic-scroller-item
          :item="item"
          :active="active"
          :data-index="index"
          class="card-grid-container"
        >
          <card v-for="card of item.chunk" :key="card.Id" :item="card" />
        </dynamic-scroller-item>
      </template>
    </dynamic-scroller>
    <v-row v-else-if="!loading" justify="center">
      <v-col cols="12" class="card-grid-container empty-card-container">
        <skeleton-card v-for="n in 24" :key="n" boilerplate />
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

<script lang="ts">
import { chunk } from 'lodash';
import Vue from 'vue';
import { BaseItemDto } from '~/api';

export default Vue.extend({
  props: {
    items: {
      type: Array,
      required: true,
      default: () => {
        return [];
      }
    },
    loading: {
      type: Boolean,
      required: true
    }
  },
  computed: {
    itemsChunks(): Array<{ [id: number]: BaseItemDto }> {
      let cardsPerLine = 8;

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (this.$vuetify.breakpoint.smAndDown) {
        cardsPerLine = 3;
      } else if (
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.$vuetify.breakpoint.smAndUp &&
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        !this.$vuetify.breakpoint.lgAndUp
      ) {
        cardsPerLine = 4;
      } else if (
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.$vuetify.breakpoint.lgAndUp &&
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        !this.$vuetify.breakpoint.xlOnly
      ) {
        cardsPerLine = 6;
      }

      const chunks = chunk(this.items, cardsPerLine);

      const keyedChunks = chunks.map((itemChunk, index) => {
        return {
          id: index,
          chunk: itemChunk
        };
      });

      return keyedChunks;
    }
  }
});
</script>

<style lang="scss" scoped>
.scroller {
  max-height: 100%;
}

@import '~vuetify/src/styles/styles.sass';
.card-grid-container {
  display: grid;
}

@media #{map-get($display-breakpoints, 'sm-and-down')} {
  .card-grid-container {
    grid-template-columns: repeat(3, minmax(calc(100% / 3), 1fr));
  }
}

@media #{map-get($display-breakpoints, 'sm-and-up')} {
  .card-grid-container {
    grid-template-columns: repeat(4, minmax(calc(100% / 4), 1fr));
  }
}

@media #{map-get($display-breakpoints, 'lg-and-up')} {
  .card-grid-container {
    grid-template-columns: repeat(6, minmax(calc(100% / 6), 1fr));
  }
}

@media #{map-get($display-breakpoints, 'xl-only')} {
  .card-grid-container {
    grid-template-columns: repeat(8, minmax(calc(100% / 8), 1fr));
  }
}
</style>
