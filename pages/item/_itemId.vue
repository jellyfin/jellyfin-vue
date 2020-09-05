<template>
  <div>
    <v-img :src="imageLink(item.Id, 'backdrop')"></v-img>
    <h1>{{ item.Name }}</h1>
    <p>{{ item.Overview }}</p>
    <v-btn color="primary">Play {{ item.Type }}</v-btn>
    <v-btn>More</v-btn>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
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
  },
  methods: {
    imageLink(id: string, type: string) {
      const url = `${this.$axios.defaults.baseURL}/Items/${id}/Images/${type}`;
      return url;
    }
  }
});
</script>
