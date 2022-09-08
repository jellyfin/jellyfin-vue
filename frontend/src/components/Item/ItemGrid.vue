<template>
  <div :class="{ 'large-grid': large }">
    <v-row v-if="loading">
      <v-col cols="12" class="card-grid-container">
        <skeleton-card v-for="n in 24" :key="n" text />
      </v-col>
    </v-row>
    <dynamic-scroller
      v-if="items.length"
      class="scroller"
      :items="itemsChunks"
      :min-item-size="350"
      :buffer="$vuetify.breakpoint.height * 1.15"
      page-mode
    >
      <template #default="{ item, index, active }">
        <dynamic-scroller-item
          :item="item"
          :active="active"
          :data-index="index"
          class="card-grid-container"
        >
          <card
            v-for="card of item.chunk"
            :key="card.Id"
            :item="card"
            margin
            text
            overlay
            link
          />
        </dynamic-scroller-item>
      </template>
    </dynamic-scroller>
    <v-row v-else-if="!loading" justify="center">
      <v-col cols="12" class="card-grid-container empty-card-container">
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

<script lang="ts">
import chunk from 'lodash/chunk';
import Vue from 'vue';
import { BaseItemDto } from '@jellyfin/client-axios';

export default Vue.extend({
  props: {
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
  },
  data() {
    return {
      itemsChunks: [] as Array<{ [id: number]: BaseItemDto }>
    };
  },
  watch: {
    '$vuetify.breakpoint.width': {
      handler(): void {
        this.chunkItems();
      }
    },
    '$vuetify.breakpoint.height': {
      handler(): void {
        this.chunkItems();
      }
    },
    items: {
      immediate: true,
      handler() {
        this.chunkItems();
      }
    }
  },
  methods: {
    chunkItems(): void {
      let cardsPerLine = this.large ? 5 : 8;

      if (this.$vuetify.breakpoint.smAndDown) {
        cardsPerLine = this.large ? 2 : 3;
      } else if (
        this.$vuetify.breakpoint.smAndUp &&
        !this.$vuetify.breakpoint.lgAndUp
      ) {
        cardsPerLine = this.large ? 3 : 4;
      } else if (
        this.$vuetify.breakpoint.lgAndUp &&
        !this.$vuetify.breakpoint.xlOnly
      ) {
        cardsPerLine = this.large ? 4 : 6;
      }

      const chunks = chunk(this.items, cardsPerLine);

      this.itemsChunks = chunks.map((itemChunk, index) => {
        return {
          id: index,
          chunk: itemChunk
        };
      });
    }
  }
});
</script>

<style lang="scss" scoped>
@import '~vuetify/src/styles/styles.sass';

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

@media #{map-get($display-breakpoints, 'sm-and-down')} {
  .card-grid-container {
    grid-template-columns: repeat(3, minmax(calc(100% / 3), 1fr));
  }

  .large-grid .card-grid-container {
    grid-template-columns: repeat(2, minmax(calc(100% / 2), 1fr));
  }
}

@media #{map-get($display-breakpoints, 'sm-and-up')} {
  .card-grid-container {
    grid-template-columns: repeat(4, minmax(calc(100% / 4), 1fr));
  }

  .large-grid .card-grid-container {
    grid-template-columns: repeat(3, minmax(calc(100% / 3), 1fr));
  }
}

@media #{map-get($display-breakpoints, 'lg-and-up')} {
  .card-grid-container {
    grid-template-columns: repeat(6, minmax(calc(100% / 6), 1fr));
  }

  .large-grid .card-grid-container {
    grid-template-columns: repeat(4, minmax(calc(100% / 4), 1fr));
  }
}

@media #{map-get($display-breakpoints, 'xl-only')} {
  .card-grid-container {
    grid-template-columns: repeat(8, minmax(calc(100% / 8), 1fr));
  }

  .large-grid .card-grid-container {
    grid-template-columns: repeat(5, minmax(calc(100% / 5), 1fr));
  }
}
</style>
