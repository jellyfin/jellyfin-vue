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
          {{ $t('selectServer') }}
        </h1>
        <div>
          <ServerCard
            v-for="server in $remote.auth.servers"
            :key="server.Id || v4()"
            class="mt-2"
            :server-info="server" />
        </div>
        <VBtn
          class="mt-6"
          block
          size="large"
          color="primary"
          variant="elevated"
          @click="$router.push('/server/add')">
          {{ $t('addServer') }}
        </VBtn>
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
import { v4 } from 'uuid';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

const { t } = useI18n();
const route = useRoute();

route.meta.title = t('selectServer');
</script>
