<template>
  <v-row class="pa-4 metadata">
    <v-col cols="3" class="tree-view-container">
      <!-- TODO: Wait for tree view to be implemented in Vuetify 3 (https://github.com/vuetifyjs/vuetify/issues/13518) -->
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
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';

type ITreeNode = {
  id: string;
  name: string | null | undefined;
  children?: ITreeNode[];
};

interface Data {
  items: ITreeNode[];
  itemId: string | undefined;
}

export default defineComponent({
  data(): Data {
    return {
      items: [],
      itemId: undefined
    };
  },
  async created() {
    const folders = (
      await this.$remote.sdk.newUserApi(getLibraryApi).getMediaFolders()
    ).data.Items;

    if (!folders) {
      return;
    }

    this.items = folders.map((dir) => {
      if (!dir.Id) {
        throw new Error('received item without id');
      }

      return {
        id: dir.Id,
        name: dir.Name,
        children: []
      };
    });
  },
  methods: {
    async fetchItems(node: ITreeNode): Promise<void> {
      if (!node.children) {
        throw new Error('expanding a node without children');
      }

      const libraryItems =
        (
          await this.$remote.sdk.newUserApi(getItemsApi).getItemsByUserId({
            userId: this.$remote.auth.currentUserId || '',
            parentId: node.id,
            sortBy: ['SortName']
          })
        ).data.Items ?? [];

      node.children.push(
        ...libraryItems.map((item) => {
          if (!item.Id) {
            throw new Error('received item without it');
          }

          const baseObject = { id: item.Id, name: item.Name };

          return item.IsFolder
            ? {
                ...baseObject,
                children: []
              }
            : baseObject;
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
