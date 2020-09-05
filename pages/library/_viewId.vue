<template>
  <div>
    <h1>
      <span>{{ Name }}</span>
    </h1>
    <div class="cardsContainer">
      <CardBuilder
        v-for="item in Items"
        :key="item.Id"
        :to="`../itemdetails/${item.Id}`"
        class="card mt-5"
        :item="item"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import CardBuilder from '~/components/cardBuilder';

export default Vue.extend({
  components: {
    CardBuilder
  },
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
      return `${this.$axios.defaults.baseURL}/Items/${id}/Images/Primary`;
    }
  }
});
</script>

<style scoped>
.cardsContainer {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-around;
}
</style>
