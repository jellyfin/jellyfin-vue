<template>
  <v-col v-show="items.length > 0">
    <h1 class="text-h5">
      <span>{{ section.name }}</span>
    </h1>

    <div class="d-flex flex-wrap">
      <card
        v-for="item in items"
        :key="item.Id"
        :to="`/item/${item.Id}`"
        class="card mt-5"
        :item="item"
      />
    </div>
  </v-col>
</template>

<script lang="ts">
import Vue from 'vue';
import { BaseItemDto } from '../api';

export default Vue.extend({
  props: {
    section: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      items: [] as BaseItemDto[]
    };
  },
  async created() {
    switch (this.section.type) {
      case 'resume': {
        const resumeItems = await this.$itemsApi.getResumeItems({
          userId: this.$auth.user.Id,
          limit: 12,
          fields: 'PrimaryImageAspectRatio',
          imageTypeLimit: 1,
          enableImageTypes: 'Primary,Backdrop,Thumb',
          enableTotalRecordCount: false,
          mediaTypes: 'Video'
        });

        this.items = resumeItems.data.Items as BaseItemDto[];
        break;
      }
      case 'resumeaudio': {
        const resumeItems = await this.$itemsApi.getResumeItems({
          userId: this.$auth.user.Id,
          limit: 12,
          fields: 'PrimaryImageAspectRatio',
          imageTypeLimit: 1,
          enableImageTypes: 'Primary,Backdrop,Thumb',
          enableTotalRecordCount: false,
          mediaTypes: 'Audio'
        });

        this.items = resumeItems.data.Items as BaseItemDto[];
        break;
      }
      case 'nextup': {
        const latestItems = await this.$tvShowsApi.getNextUp({
          userId: this.$auth.user.Id,
          limit: 12,
          fields: 'PrimaryImageAspectRatio',
          imageTypeLimit: 1,
          enableImageTypes: 'Primary,Backdrop,Thumb',
          parentId: this.section.libraryId
        });

        this.items = latestItems.data.Items as BaseItemDto[];
        break;
      }
      case 'latestmedia': {
        const latestItems = await this.$userLibraryApi.getLatestMedia({
          userId: this.$auth.user.Id,
          limit: 12,
          fields: 'PrimaryImageAspectRatio',
          imageTypeLimit: 1,
          enableImageTypes: 'Primary,Backdrop,Thumb',
          parentId: this.section.libraryId
        });

        this.items = latestItems.data;
        break;
      }
      default:
        break;
    }
  }
});
</script>
