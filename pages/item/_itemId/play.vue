<template>
  <v-container fill-height fluid class="pa-0">
    <video-player
      v-if="item.MediaType === 'Video' || item.MediaType === 'Audio'"
      :item="item"
      :poster="poster"
    />
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { BaseItemDto } from '@jellyfin/client-axios';
import imageHelper from '~/mixins/imageHelper';

export default Vue.extend({
  mixins: [imageHelper],
  layout: 'fullpage',
  data() {
    return {
      poster: '',
      item: [] as BaseItemDto
    };
  },
  async beforeMount() {
    try {
      const response = await this.$api.items.getItems({
        userId: this.$auth.user.Id,
        ids: [this.$route.params.itemId]
      });

      if (response?.data?.Items?.[0]) {
        this.item = response.data.Items[0];
      } else {
        throw new Error('Item not found');
      }

      this.poster = this.getImageUrl(this.$route.params.itemId, 'backdrop');
    } catch (error) {
      this.$nuxt.error({
        statusCode: 404,
        message: error
      });
    }
  }
});
</script>
