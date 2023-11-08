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
          {{ $t('login.addServer') }}
        </h1>
        <AddServerForm />
      </VCol>
    </VRow>
  </VContainer>
</template>

<route lang="yaml">
meta:
  layout: server
</route>

<script setup lang="ts">
import { useRoute } from 'vue-router/auto';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const route = useRoute();

route.meta.title = t('login.addServer');
</script>
