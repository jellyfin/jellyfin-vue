<template>
  <v-text-field
    v-model="searchQuery"
    class="search-input"
    prepend-inner-icon="mdi-magnify"
    :placeholder="$t('search.name')"
    dense
    outlined
    filled
    flat
    hide-details
    single-line />
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  computed: {
    searchQuery: {
      get(): string {
        return this.$route.query.q?.toString();
      },
      set(value: string): void {
        if (value === '' || !value) {
          this.$router.back();
        } else if (this.searchQuery) {
          this.$router.replace({ path: '/search', query: { q: value } });
        } else {
          this.$router.push({ path: '/search', query: { q: value } });
        }
      }
    }
  }
});
</script>
