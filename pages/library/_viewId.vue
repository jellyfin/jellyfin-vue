<template>
  <v-container>
    <v-row v-if="!loaded">
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
      <template v-slot="{ item, index, active }">
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
    <v-row v-else-if="loaded" justify="center">
      <h1 class="text-h4 text-center">{{ $t('libraryEmpty') }}</h1>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { chunk } from 'lodash';
import { BaseItemDto } from '../../api';

export default Vue.extend({
  data() {
    return {
      items: [] as BaseItemDto[],
      loaded: false
    };
  },
  computed: {
    itemsChunks: {
      get() {
        let cardsPerLine = 8;

        if (this.$vuetify.breakpoint.smAndDown) {
          cardsPerLine = 3;
        } else if (
          this.$vuetify.breakpoint.smAndUp &&
          !this.$vuetify.breakpoint.lgAndUp
        ) {
          cardsPerLine = 4;
        } else if (
          this.$vuetify.breakpoint.lgAndUp &&
          !this.$vuetify.breakpoint.xlOnly
        ) {
          cardsPerLine = 6;
        }

        const chunks = chunk(this.$data.items, cardsPerLine);

        const keyedChunks = chunks.map((itemChunk, index) => {
          return {
            id: index,
            chunk: itemChunk
          };
        });

        return keyedChunks;
      }
    }
  },
  async beforeMount() {
    try {
      const collectionInfo = await this.$itemsApi.getItems({
        uId: this.$auth.user.Id,
        userId: this.$auth.user.Id,
        ids: this.$route.params.viewId
      });

      if (
        collectionInfo.data.Items &&
        (collectionInfo.data.Items[0].Type === 'CollectionFolder' ||
          collectionInfo.data.Items[0].Type === 'Folder')
      ) {
        if (collectionInfo.data.Items[0].Name) {
          this.$page.setTitle(collectionInfo.data.Items[0].Name);
        }

        const options = {
          uId: this.$auth.user.Id,
          userId: this.$auth.user.Id,
          parentId: this.$route.params.viewId,
          includeItemTypes: '',
          recursive: true,
          sortBy: 'SortName',
          sortOrder: 'Ascending'
        };

        if (collectionInfo.data.Items[0].CollectionType === 'tvshows') {
          options.includeItemTypes = 'Series';
        } else if (collectionInfo.data.Items[0].CollectionType === 'movies') {
          options.includeItemTypes = 'Movie';
        } else if (collectionInfo.data.Items[0].CollectionType === 'books') {
          options.includeItemTypes = 'Book';
        }

        const itemsResponse = await this.$itemsApi.getItems(options);

        if (itemsResponse.data) {
          this.loaded = true;
        }

        this.items = itemsResponse.data.Items || [];
      }
    } catch (error) {
      // Can't get given library ID
      this.$nuxt.error({
        statusCode: 404,
        message: this.$t('libraryNotFound') as string
      });
    }
  },
  head() {
    return {
      title: this.$store.state.page.title
    };
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
