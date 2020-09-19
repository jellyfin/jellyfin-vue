<template>
  <v-container>
    <v-row>
      <v-col v-for="item in items" :key="item.Id" cols="6" sm="4" md="3" lg="2">
        <card :item="item" />
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
