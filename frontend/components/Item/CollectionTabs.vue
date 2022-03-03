<template>
  <div v-if="!!children">
    <v-tabs v-model="currentTab" class="mb-3" background-color="transparent">
      <v-tab v-for="typeList in children" :key="typeList.Type">
        {{ typeList.Type }} ({{ typeList.Items.length }})
      </v-tab>
    </v-tabs>
    <h1
      v-if="(!children && !loading) || (children && children.length === 0)"
      class="text-h5 text-center"
    >
      {{ $t('collectionEmpty') }}
    </h1>
    <v-tabs-items v-model="currentTab" class="transparent">
      <v-tab-item v-for="typeList in children" :key="typeList.Type">
        <v-container>
          <skeleton-item-grid v-if="loading" :view-type="''" />
          <item-grid :loading="loading" :items="typeList.Items" />
        </v-container>
      </v-tab-item>
    </v-tabs-items>
  </div>
</template>

<script lang="ts">
import { BaseItemDto } from '@jellyfin/client-axios';
import Vue from 'vue';
import { mapStores } from 'pinia';
import { itemsStore } from '~/store';

export default Vue.extend({
  props: {
    item: {
      type: Object as () => BaseItemDto,
      required: true
    }
  },
  data() {
    return {
      currentTab: 0,
      loading: false
    };
  },
  computed: {
    ...mapStores(itemsStore),
    children(): BaseItemDto[] {
      return this.items.getChildrenOfParent(this.item.Id) || [];
    }
  },
  watch: {
    item: {
      immediate: true,
      async handler(item: BaseItemDto): Promise<void> {
        if (!this.children) {
          this.loading = true;
          await this.items.fetchAndAddCollection(item.Id);
          this.loading = false;
        }
      }
    }
  }
});
</script>
