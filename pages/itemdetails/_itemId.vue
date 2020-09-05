<template>
  <div>
    <v-img :src="imageLink(Item.Id, 'backdrop')"></v-img>
    <h1>{{ Item.Name }}</h1>
    <p>{{ Item.Overview }}</p>
    <v-btn color="primary">Play {{ Item.Type }} </v-btn>
    <v-btn>More</v-btn>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  data() {
    return {
      Name: '',
      Item: {},
      Seasons: {},
      Episodes: []
    };
  },

  async beforeMount() {
    const Item = await this.$itemsApi.getItems({
      uId: this.$auth.user.Id,
      userId: this.$auth.user.Id,
      ids: this.$route.params.itemId,
      fields: 'Overview'
    });

    this.Item = Item.data.Items[0];
  },
  methods: {
    imageLink(id: string, type: string) {
      const url = `${this.$axios.defaults.baseURL}/Items/${id}/Images/${type}`;
      return url;
    }
  }
});
</script>
