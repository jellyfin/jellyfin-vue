<template>
  <VContainer
    class="fill-height"
    fluid>
    <VRow justify="center">
      <VCol
        sm="6"
        md="6"
        lg="5">
        <h1 class="text-h4 mb-6 text-center">
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
import { useI18n } from 'vue-i18n';
import { usePageTitle } from '#/composables/page-title';

const { t } = useI18n();

usePageTitle(() => t('addServer'));
</script>
