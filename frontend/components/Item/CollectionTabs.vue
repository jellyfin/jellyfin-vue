<template>
  <div v-if="!!children">
    <v-tabs v-model="currentTab" class="mb-3" background-color="transparent">
      <v-tab v-for="(items, type) in children" :key="type">
        {{ type }} ({{ items.length }})
      </v-tab>
    </v-tabs>
    <h1 v-if="!children && !loading" class="text-h5 text-center">
      {{ $t('collectionEmpty') }}
    </h1>
    <v-tabs-items v-model="currentTab" class="transparent">
      <v-tab-item v-for="(items, type) in children" :key="type">
        <v-container>
          <skeleton-item-grid v-if="loading" :view-type="''" />
          <item-grid :loading="loading" :items="items" />
        </v-container>
      </v-tab-item>
    </v-tabs-items>
  </div>
</template>

<script lang="ts">
import { BaseItemDto } from '@jellyfin/client-axios';
import groupBy from 'lodash/groupBy';
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
    children(): Record<string, BaseItemDto[]> | undefined {
      if (this.items.getChildrenOfParentCollection(this.item.Id)?.length) {
        return groupBy(
          this.items.getChildrenOfParentCollection(this.item.Id),
          'Type'
        );
      }
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
