<template>
  <div>
    <h1>{{ Name }}</h1>
    <v-list>
      <v-list-item
        v-for="item in Items"
        :key="item.Id"
        :to="`../itemdetails/${item.Id}`"
      >
        <v-list-item-content>
          <v-list-item-title>
            {{ item.Name }}
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ item.ProductionYear }}
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </v-list>
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

      console.log(itemsResponse);

      this.Items = itemsResponse.data.Items;
    }
  }
});
</script>
