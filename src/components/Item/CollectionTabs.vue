<template>
  <div v-if="!!children">
    <v-tabs v-model="currentTab" class="mb-3" background-color="transparent">
      <v-tab v-for="typeList in children" :key="typeList.Type">
        {{ typeList.Type }} ({{ typeList.Items.length }})
      </v-tab>
    </v-tabs>
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
import { mapGetters, mapActions } from 'vuex';

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
    ...mapGetters('items', ['getBoxsetChildren']),
    children(): BaseItemDto[] {
      return this.getBoxsetChildren(this.item.Id);
    }
  },
  watch: {
    item: {
      immediate: true,
      async handler(item: BaseItemDto): Promise<void> {
        this.loading = true;
        await this.fetchBoxsetChildren({ itemId: item.Id });
        this.loading = false;
      }
    }
  },
  methods: {
    ...mapActions('items', ['fetchBoxsetChildren'])
  }
});
</script>
