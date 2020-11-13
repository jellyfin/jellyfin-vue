<template>
  <v-container>
    <v-row class="align-center">
      <v-col cols="9">
        <v-select
          v-model="orderMethod"
          class="ma-2"
          :items="sortChoices"
          autowidth
          @change="sortItems"
        ></v-select>
      </v-col>
      <v-col>
        <v-btn class="ma-2" @click="changeSortDirection"
          ><v-icon :class="{ flipped: sortDirection }"
            >mdi-arrow-up</v-icon
          ></v-btn
        >
      </v-col>

      <v-col>
        <filter-button
          :collection-info-item="collectionInfoItem"
          @change="filterMedia"
        />
      </v-col>
    </v-row>
    <v-row v-if="!loaded">
      <v-col cols="12" class="card-grid-container">
        <skeleton-card v-for="n in 24" :key="n" />
      </v-col>
    </v-row>
    <v-row v-if="items.length">
      <v-col cols="12" class="card-grid-container">
        <lazy-cards v-for="item in items" :key="item.Id" :item="item" />
      </v-col>
    </v-row>
    <v-row v-else-if="loaded" justify="center">
      <v-col cols="12" class="card-grid-container empty-card-container">
        <skeleton-card v-for="n in 24" :key="n" boilerplate />
      </v-col>
      <div class="empty-message text-center">
        <h1 class="text-h5">
          {{ $t('libraryEmpty') }}
        </h1>
      </div>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';
import { chunk } from 'lodash';
import { BaseItemDto, ItemsApiGetItemsRequest } from '~/api/api';

export default Vue.extend({
  data() {
    return {
      items: [] as BaseItemDto[],
      loaded: false,
      sortChoices: [
        { text: this.$t('alphabetically'), value: 'SortName' },
        { text: this.$t('rating'), value: 'CommunityRating' },
        { text: this.$t('releaseDate'), value: 'PremiereDate' },
        { text: this.$t('endDate'), value: 'EndDate' }
      ],
      orderMethod: 'SortName',
      sortDirection: true,
      collectionInfoItem: {}
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
    this.$nextTick(() => {
      this.$nuxt.$loading.start();
    });
    try {
      const collectionInfo = await this.$api.items.getItems({
        uId: this.$auth.user.Id,
        userId: this.$auth.user.Id,
        ids: this.$route.params.viewId
      });

      if (
        collectionInfo.data.Items &&
        (collectionInfo.data.Items[0].Type === 'CollectionFolder' ||
          collectionInfo.data.Items[0].Type === 'Folder')
      ) {
        this.collectionInfoItem = collectionInfo.data.Items[0];

        if (collectionInfo.data.Items[0].Name) {
          this.setPageTitle({
            title: collectionInfo.data.Items[0].Name
          });
        }

        const options = {
          uId: this.$auth.user.Id,
          userId: this.$auth.user.Id,
          parentId: this.$route.params.viewId,
          includeItemTypes: '',
          recursive: true,
          sortBy: 'SortName',
          sortOrder: 'Ascending',
          fields: 'SortName'
        };

        if (collectionInfo.data.Items[0].CollectionType === 'tvshows') {
          options.includeItemTypes = 'Series';
        } else if (collectionInfo.data.Items[0].CollectionType === 'movies') {
          options.includeItemTypes = 'Movie';
        } else if (collectionInfo.data.Items[0].CollectionType === 'books') {
          options.includeItemTypes = 'Book';
        }

        const itemsResponse = await this.$api.items.getItems(options);

        if (itemsResponse.data) {
          this.loaded = true;
          this.$nuxt.$loading.finish();
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
  methods: {
    ...mapActions('page', ['setPageTitle']),
    async filterMedia(options: ItemsApiGetItemsRequest) {
      try {
        const sortObject: any = {};
        sortObject.sortBy = this.orderMethod;
        sortObject.sortOrder = this.sortDirection;
        sortObject.fields = this.orderMethod;

        Object.assign(options, sortObject);

        const itemsResponse = await this.$api.items.getItems(options);

        if (itemsResponse.data) {
          this.loaded = true;
        }

        this.items = itemsResponse.data.Items || [];
      } catch (error) {
        // Can't get given library ID
        this.$nuxt.error({
          statusCode: 404,
          message: this.$t('libraryNotFound') as string
        });
      }
    },
    sortItems() {
      if (this.sortDirection) {
        this.items.sort((a, b) =>
          (a[this.orderMethod as keyof BaseItemDto] || '') >
          (b[this.orderMethod as keyof BaseItemDto] || '')
            ? 1
            : -1
        );
      } else {
        this.items.sort((a, b) =>
          (a[this.orderMethod as keyof BaseItemDto] || '') <
          (b[this.orderMethod as keyof BaseItemDto] || '')
            ? 1
            : -1
        );
      }
    },
    changeSortDirection() {
      this.sortDirection = !this.sortDirection;
      this.sortItems();
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

.flipped {
  transform: rotateZ(180deg);
}
</style>
