<template>
  <v-row class="pa-4">
    <v-col cols="3" class="tree-view-container">
      <v-treeview
        :items="items"
        :load-children="fetchItems"
        activatable
        transition
        @update:active="handleAction"
      ></v-treeview>
    </v-col>

    <v-col v-if="itemId" cols="9">
      <metadata-editor :item-id="itemId"></metadata-editor>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from 'vue';

import { BaseItemDto } from '~/api';

type ITreeNode = {
  id: string | number | undefined;
  name: string | null | undefined;
  children?: ITreeNode[];
};
export default Vue.extend({
  data() {
    return {
      items: [] as ITreeNode[],
      itemId: ''
    };
  },
  computed: {},
  async created() {
    const floders = (await this.$libraryApi.getMediaFolders()).data
      .Items as BaseItemDto[];

    this.items = floders.map((dir, index) => {
      return {
        id: dir.Id || index,
        name: dir.Name,
        children: [] as ITreeNode[]
      };
    });
  },
  methods: {
    async fetchItems(node: ITreeNode) {
      const userId = this.$auth.user.Id;
      const libItems = (((
        await this.$userLibraryApi.getItem(
          { userId, itemId: '' },
          {
            query: {
              ParentId: node.id,
              SortBy: 'SortName'
            }
          }
        )
      ).data as unknown) as { Items: BaseItemDto[] }).Items; //

      (node.children as ITreeNode[]).push(
        ...libItems.map((item) => {
          const baseObj = { id: item.Id, name: item.Name };
          return item.IsFolder
            ? {
                ...baseObj,
                children: []
              }
            : baseObj;
        })
      );
    },
    handleAction(ids: string[]) {
      this.$data.itemId = ids[0];
    }
  }
});
</script>
<style scoped>
.tree-view-container {
  border-right: 1px solid var(--v-secondary-lighten1);
}
</style>
