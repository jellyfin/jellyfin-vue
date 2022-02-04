<template>
  <v-row class="pa-4 metadata">
    <v-col cols="3" class="tree-view-container">
      <v-treeview
        :items="items"
        :load-children="fetchItems"
        activatable
        transition
        @update:active="handleAction"
      />
    </v-col>

    <v-col v-if="itemId" cols="9" class="metadata-card">
      <metadata-editor :item-id="itemId" />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from 'vue';

import { BaseItemDto } from '@jellyfin/client-axios';

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
    const folders = (await this.$api.library.getMediaFolders()).data
      .Items as BaseItemDto[];

    this.items = folders.map((dir, index) => {
      return {
        id: dir.Id || index,
        name: dir.Name,
        children: [] as ITreeNode[]
      };
    });
  },
  methods: {
    async fetchItems(node: ITreeNode): Promise<void> {
      const libItems = (
        (
          await this.$api.userLibrary.getItem(
            { userId: this.$auth.user?.Id, itemId: '' },
            {
              query: {
                ParentId: node.id,
                SortBy: 'SortName'
              }
            }
          )
        ).data as unknown as { Items: BaseItemDto[] }
      ).Items; //

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
    handleAction(ids: string[]): void {
      this.$data.itemId = ids[0];
    }
  }
});
</script>
<style scoped>
.metadata {
  height: calc(100vh - 64px);
  overflow: hidden;
}

.tree-view-container {
  border-right: 1px solid var(--v-secondary-lighten1);
  height: 100%;
  overflow: auto;
}

.metadata-card {
  height: 100%;
}
</style>
