<template>
  <VTextField
    v-model="searchQuery"
    class="search-input"
    :prepend-inner-icon="IMdiMagnify"
    :placeholder="$t('search')"
    density="compact"
    hide-details
    single-line
    @update:focused="onFocus" />
</template>

<script setup lang="ts">
import IMdiMagnify from 'virtual:icons/mdi/magnify';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const searchQuery = computed({
  get(): string {
    return route.query.q?.toString() ?? '';
  },
  set(value) {
    void router.replace({
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
async function onFocus(focused: boolean): Promise<void> {
  if (!searchQuery.value && !focused && window.history.length) {
    router.back();
  } else if (focused && !searchQuery.value) {
    await router.push({ path: '/search' });
  }
}
</script>
