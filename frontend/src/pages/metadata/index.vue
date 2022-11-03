<template>
  <v-row class="pa-4 metadata">
    <v-col cols="3" class="tree-view-container">
      <!-- TODO: Wait for Vuetify 3.1 -->
      <!-- <v-treeview
        :items="items"
        :load-children="fetchItems"
        activatable
        transition
        @update:active="handleAction"
      /> -->
    </v-col>

    <v-col v-if="itemId" cols="9" class="metadata-card">
      <metadata-editor :item-id="itemId" />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapStores } from 'pinia';
import { BaseItemDto } from '@jellyfin/client-axios';
import { authStore } from '~/store';

type ITreeNode = {
  id: string | number | undefined;
  name: string | null | undefined;
  children?: ITreeNode[];
};

export default defineComponent({
  data() {
    return {
      items: [] as ITreeNode[],
      itemId: ''
    };
  },
  computed: {
    ...mapStores(authStore)
  },
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
            { userId: this.auth.currentUserId, itemId: '' },
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
<style lang="scss" scoped>
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
