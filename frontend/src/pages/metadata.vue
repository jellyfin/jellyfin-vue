<template>
  <VRow class="pa-4 metadata">
    <VCol
      cols="3"
      class="tree-view-container">
      <!-- TODO: Wait for Vuetify 3 implementation (https://github.com/vuetifyjs/vuetify/issues/13518) -->
      <!-- <v-treeview
        :items="items"
        :load-children="fetchChildItems"
        activatable
        transition
        @update:active="onExpandItems"
      /> -->
    </VCol>

    <VCol
      v-if="itemId"
      cols="9"
      class="metadata-card">
      <MetadataEditor :item-id="itemId" />
    </VCol>
  </VRow>
</template>

<script setup lang="ts">
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { ref } from 'vue';
import { remote } from '#/plugins/remote';

interface ITreeNode {
  id: string;
  name: string | null | undefined;
  children?: ITreeNode[];
}

const initialItems = (
  (await remote.sdk.newUserApi(getLibraryApi).getMediaFolders()).data.Items
  ?? []
).map((dir) => {
  if (!dir.Id) {
    throw new Error('received item without id');
  }

  return {
    id: dir.Id,
    name: dir.Name,
    children: []
  };
});

const items = ref<ITreeNode[]>(initialItems);
const itemId = ref<string>();

/**
 * Fetch child items for the given tree node
 */
async function fetchChildItems(node: ITreeNode): Promise<void> {
  if (!node.children) {
    throw new Error('expanding a node without children');
  }

  const libraryItems
    = (
      await remote.sdk.newUserApi(getItemsApi).getItems({
        userId: remote.auth.currentUserId.value,
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
}

/**
 * Handles a tree item being expanded
 */
function onExpandItems(ids: string[]): void {
  itemId.value = ids[0];
}
</script>
<style scoped>
.metadata {
  height: calc(100vh - 64px);
  overflow: hidden;
}

.tree-view-container {
  height: 100%;
  overflow: auto;
}

.metadata-card {
  height: 100%;
}
</style>
