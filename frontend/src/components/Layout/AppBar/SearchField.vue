<template>
  <v-text-field
    v-model="searchQuery"
    class="search-input"
    :prepend-inner-icon="IMdiMagnify"
    :placeholder="$t('search.name')"
    variant="solo"
    hide-details
    single-line />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import IMdiMagnify from '~icons/mdi/magnify';

const route = useRoute();
const router = useRouter();

const searchQuery = computed({
  get(): string {
    return route.query.q?.toString() || '';
  },
  set(value: string) {
    if (value === '' || !value) {
      router.back();
    } else if (searchQuery.value) {
      router.replace({ path: '/search', query: { q: value } });
    } else {
      router.push({ path: '/search', query: { q: value } });
    }
  }
});
</script>
