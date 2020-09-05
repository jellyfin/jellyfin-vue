<template>
  <div>
    <h1>
      <span>{{ name }}</span>
    </h1>
    <div class="d-flex flex-wrap justify-space-around">
      <card
        v-for="item in items"
        :key="item.Id"
        class="card mt-5"
        :item="item"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  data() {
    return {
      name: '',
      items: {}
    };
  },
  async beforeMount() {
    const collectionInfo = await this.$itemsApi.getItems({
      uId: this.$auth.user.Id,
      userId: this.$auth.user.Id,
      ids: this.$route.params.viewId
    });

    if (
      collectionInfo.data.Items &&
      collectionInfo.data.Items[0].Type === 'CollectionFolder'
    ) {
      this.name = collectionInfo.data.Items[0].Name || '';

      const itemsResponse = await this.$itemsApi.getItems({
        uId: this.$auth.user.Id,
        userId: this.$auth.user.Id,
        parentId: this.$route.params.viewId,
        sortBy: 'SortName',
        sortOrder: 'Ascending'
      });

      this.items = itemsResponse.data.Items || [];
    }
  }
});
</script>
