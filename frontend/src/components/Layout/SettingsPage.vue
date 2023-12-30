<template>
  <VContainer>
    <VRow v-if="pageTitle">
      <VCol>
        <VRow class="mx-0 mt-4 mb-2 justify-space-between">
          <h2 class="text-h4">
            <!-- We're sure that we're using correct keys at the type level -->
            <!-- eslint-disable-next-line @intlify/vue-i18n/no-dynamic-keys -->
            {{ $t(pageTitle) }}
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
import type { messages } from 'vue-i18n';

defineProps<{ pageTitle?: keyof messages }>();
</script>
