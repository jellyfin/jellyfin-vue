<template>
  <v-row class="pa-4" justify="space-between">
    <v-col cols="5">
      <v-treeview
        :items="items"
        :load-children="fetchItems"
        :open.sync="open"
        activatable
        color="warning"
        transition
      >
        <!-- <template v-slot:prepend="{ item, active }">
          <v-icon v-if="!item.children">mdi-account</v-icon>
        </template> -->
      </v-treeview>
    </v-col>

    <v-divider vertical></v-divider>

    <v-col class="d-flex text-center">
      <v-scroll-y-transition mode="out-in">
        <v-card
          v-if="selected"
          :key="selected.id"
          class="pt-6 mx-auto"
          flat
          max-width="400"
        >
          <v-card-text>
            <v-avatar v-if="avatar" size="88">
              <v-img
                :src="`https://avataaars.io/${avatar}`"
                class="mb-6"
              ></v-img>
            </v-avatar>
            <h3 class="headline mb-2">
              {{ selected.name }}
            </h3>
            <div class="blue--text mb-2">{{ selected.email }}</div>
            <div class="blue--text subheading font-weight-bold">
              {{ selected.username }}
            </div>
          </v-card-text>
          <v-divider></v-divider>
          <v-row class="text-left" tag="v-card-text">
            <v-col class="text-right mr-4 mb-2" tag="strong" cols="5"
              >Company:</v-col
            >
            <v-col>{{ selected.company.name }}</v-col>
            <v-col class="text-right mr-4 mb-2" tag="strong" cols="5"
              >Website:</v-col
            >
            <v-col>
              <a :href="`//${selected.website}`" target="_blank">{{
                selected.website
              }}</a>
            </v-col>
            <v-col class="text-right mr-4 mb-2" tag="strong" cols="5"
              >Phone:</v-col
            >
            <v-col>{{ selected.phone }}</v-col>
          </v-row>
        </v-card>
      </v-scroll-y-transition>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import Vue from 'vue';
import { BaseItemDto } from '~/api';

type BaseQuery = {
  userId: string;
  itemId: string;
};
type ReqOptions = {
  query: {
    ParentId: string;
  };
};
type ITreeNode = {
  id: string;
  name: string;
  children: any[];
};
export default Vue.extend({
  // layout: 'fullpage',
  data() {
    return {
      items: [] as any[]
    };
  },
  async created() {
    const floders = (await this.$libraryApi.getMediaFolders()).data
      .Items as BaseItemDto[];

    this.items = floders.map((dir, index) => {
      return {
        id: dir.Id || index,
        name: dir.Name,
        children: []
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
              ParentId: node.id
            }
          }
        )
      ).data as unknown) as { Items: BaseItemDto[] }).Items;

      node.children.push(
        ...libItems.map((item) => {
          return {
            id: item.Id,
            name: item.Name,
            children: []
          };
        })
      );
      console.log(node);
    }
  }
});
</script>
