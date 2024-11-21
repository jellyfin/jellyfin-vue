<template>
  <VContainer>
    <VRow v-if="$slots.title">
      <VCol>
        <VRow class="mt-4 mb-2 mx-0 justify-space-between">
          <h2 class="text-h4">
            <slot name="title" />
          </h2>
          <div>
            <slot name="actions" />
          </div>
        </VRow>
      </VCol>
    </VRow>
    <VRow>
      <slot name="content" />
    </VRow>
  </VContainer>
</template>

<script setup lang="ts">
import { useSlots, computed } from 'vue';
import { usePageTitle } from '@/composables/page-title';
import { isStr } from '@/utils/validation';

const slots = useSlots();
const pageTitle = computed(() => {
  const slot = slots.title?.()[0].children;

  return isStr(slot) ? slot : undefined;
});

usePageTitle(pageTitle);
</script>
