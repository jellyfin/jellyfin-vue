<template>
  <v-text-field
    v-model="searchQuery"
    class="search-input"
    :prepend-inner-icon="IMdiMagnify"
    :placeholder="$t('search.name')"
    density="compact"
    hide-details
    single-line
    @update:focused="onFocus" />
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
    router.replace({
      ...router.currentRoute,
      query: {
        q: value.trim() || undefined
      }
    });
  }
});

/**
 * Handle page redirects depending on the focus state of the component
 */
function onFocus(focused: boolean): void {
  if (!searchQuery.value && !focused && window.history.length > 0) {
    router.back();
  } else if (focused && !searchQuery.value) {
    router.push({ path: '/search' });
  }
}
</script>
