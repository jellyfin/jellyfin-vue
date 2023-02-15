<template>
  <v-text-field
    v-model="searchQuery"
    class="search-input"
    :prepend-inner-icon="IMdiMagnify"
    :placeholder="$t('search.name')"
    :density="'comfortable'"
    hide-details
    single-line />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import IMdiMagnify from 'virtual:icons/mdi/magnify';

const route = useRoute();
const router = useRouter();

const searchQuery = computed({
  get(): string {
    return route.query.q?.toString() || '';
  },
  set(value: string) {
    // @ts-expect-error - Typechecking error from Vue typed Router
    if (value && route.name !== 'search') {
      router.push({
        path: '/search',
        query: {
          q: value
        }
      });
      // @ts-expect-error - Typechecking error from Vue typed Router
    } else if (route.name === 'search') {
      router.replace({
        ...router.currentRoute,
        query: {
          q: value || undefined
        }
      });
    }
  }
});
</script>
