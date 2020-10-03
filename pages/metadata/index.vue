<template>
  <v-row class="pa-4">
    <v-col cols="4" class="tree-view-container">
      <v-treeview
        :items="items"
        :load-children="fetchItems"
        activatable
        color="warning"
        transition
        @update:active="fetchItemInfo"
      >
      </v-treeview>
    </v-col>

    <v-col v-if="showEdit" cols="8"
      ><edit-metadata :metadata="metadata"></edit-metadata
    ></v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from 'vue';
import { isEmpty } from 'lodash';

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
      metadata: {}
    };
  },
  computed: {
    showEdit() {
      return !isEmpty(this.$data.metadata);
    }
  },
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
    async fetchItemInfo(ids: string[]) {
      const userId = this.$auth.user.Id;
      const itemInfo = (
        await this.$userLibraryApi.getItem({
          userId,
          itemId: ids[0]
        })
      ).data;
      this.metadata = itemInfo;
    }
  }
});
</script>
<style scoped>
.tree-view-container {
  border-right: 1px solid var(--v-secondary-lighten1);
}
</style>
