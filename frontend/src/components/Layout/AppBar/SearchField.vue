<template>
  <VTextField
    v-model="searchQuery"
    class="search-input"
    :placeholder="$t('search')"
    density="compact"
    hide-details
    single-line
    @update:focused="onFocus">
    <template #prepend-inner>
      <JIcon
        class="i-mdi:magnify" />
    </template>
  </VTextField>
</template>

<script setup lang="ts">
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
      ...router.currentRoute.value,
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
  if (!searchQuery.value && !focused && globalThis.history.length) {
    router.back();
  } else if (focused && !searchQuery.value) {
    await router.push({ path: '/search' });
  }
}
</script>
