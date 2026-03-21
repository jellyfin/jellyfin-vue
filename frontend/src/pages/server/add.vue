<template>
  <VContainer
    class="uno-h-height"
    fluid>
    <VRow justify="center">
      <VCol
        sm="6"
        md="6"
        lg="5">
        <h1 class="text-h4 uno-mb-6 uno-text-center">
          {{ $t('addServer') }}
        </h1>
        <AddServerForm />
      </VCol>
    </VRow>
  </VContainer>
</template>

<route lang="yaml">
meta:
  layout:
    name: server
</route>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { usePageTitle } from '#/composables/page-title';

const { t } = useTranslation();

usePageTitle(() => t('addServer'));
</script>
