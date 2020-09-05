<template>
  <div>
    <v-img :src="getImageLink(item.Id, 'backdrop')"></v-img>
    <h1>{{ item.Name }}</h1>
    <p>{{ item.Overview }}</p>
    <v-btn color="primary">Play {{ item.Type }}</v-btn>
    <v-btn>More</v-btn>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import imageHelper from '~/mixins/imageHelper';

export default Vue.extend({
  mixins: [imageHelper],
  data() {
    return {
      item: {}
    };
  },

  async beforeMount() {
    const Item = await this.$itemsApi.getItems({
      uId: this.$auth.user.Id,
      userId: this.$auth.user.Id,
      ids: this.$route.params.itemId,
      fields: 'Overview'
    });

    this.item = Item.data.Items[0];
  }
});
</script>
