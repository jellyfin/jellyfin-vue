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
      type: Object,
      required: true
    }
  },
  data() {
    return {
      currentTab: 0,
      loading: false,
      breakpoints: {
        600: {
          visibleSlides: 2
        },
        960: {
          visibleSlides: 3
        },
        1264: {
          visibleSlides: 4
        },
        1904: {
          visibleSlides: 5
        }
      }
    };
  },
  async fetch() {
    this.loading = true;
    await this.fetchBoxsetChildren({ itemId: this.item.Id }).finally(
      () => (this.loading = false)
    );
  },
  computed: {
    ...mapGetters('items', ['getBoxsetChildren']),
    children(): BaseItemDto[] {
      return this.getBoxsetChildren(this.item.Id);
    }
  },
  methods: {
    ...mapActions('items', {
      fetchBoxsetChildren: 'fetchBoxsetChildren'
    })
  }
});
</script>
