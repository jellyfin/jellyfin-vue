<template>
  <div>
    <h1>{{ Name }}</h1>
    <div class="cardsContainer">
      <v-card
        v-for="item in Items"
        :key="item.Id"
        :to="`../itemdetails/${item.Id}`"
        class="card mt-5"
      >
        <v-img class="cardImage" :src="imageLink(item.Id)" />
        <v-card-title>
          {{ item.Name }}
        </v-card-title>
        <v-card-subtitle>
          {{ item.ProductionYear }}
        </v-card-subtitle>
      </v-card>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  data() {
    return {
      Name: '',
      Items: {}
    };
  },
  async beforeMount() {
    const collectionInfo = await this.$itemsApi.getItems({
      uId: this.$auth.user.Id,
      userId: this.$auth.user.Id,
      ids: this.$route.params.viewId
    });

    if (collectionInfo.data.Items[0].Type === 'CollectionFolder') {
      this.Name = collectionInfo.data.Items[0].Name;

      const itemsResponse = await this.$itemsApi.getItems({
        uId: this.$auth.user.Id,
        userId: this.$auth.user.Id,
        parentId: this.$route.params.viewId,
        sortBy: 'SortName',
        sortOrder: 'Ascending'
      });

      this.Items = itemsResponse.data.Items;
    }
  },
  methods: {
    imageLink(id: string) {
      const url = `${this.$axios.defaults.baseURL}/Items/${id}/Images/Primary`;
      return url;
    }
  }
});
</script>
