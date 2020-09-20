<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="card-grid-container">
        <card v-for="item in items" :key="item.Id" :item="item" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { BaseItemDto } from '../../api';

export default Vue.extend({
  data() {
    return {
      items: [] as BaseItemDto[]
    };
  },
  async beforeMount() {
    try {
      const collectionInfo = await this.$itemsApi.getItems({
        uId: this.$auth.user.Id,
        userId: this.$auth.user.Id,
        ids: this.$route.params.viewId
      });

      console.dir(collectionInfo.data.Items);

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
