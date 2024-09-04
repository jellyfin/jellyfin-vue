<template>
  <VCard :loading="loading">
    <VRow
      no-gutters
      align="center">
      <VCol class="mb-2">
        <VCardTitle>{{ serverInfo.ServerName }}</VCardTitle>
        <VCardSubtitle class="mt-n2">
          {{ serverInfo.PublicAddress }}
        </VCardSubtitle>
      </VCol>
      <VCol cols="auto">
        <VCardActions>
          <VBtn
            icon
            disabled>
            <VIcon>
              <IMdiInformationOutline />
            </VIcon>
          </VBtn>
          <VBtn
            icon
            :disabled="loading || serverInfo.isDefault"
            @click="removeServer">
            <VIcon>
              <IMdiDelete />
            </VIcon>
          </VBtn>
          <VBtn
            icon
            :disabled="loading"
            @click="setServer">
            <VIcon>
              <IMdiArrowRight />
            </VIcon>
          </VBtn>
        </VCardActions>
      </VCol>
    </VRow>
  </VCard>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import { remote } from '@/plugins/remote';
import type { ServerInfo } from '@/plugins/remote/auth';

const { serverInfo } = defineProps<{ serverInfo: ServerInfo }>();

const loading = shallowRef(false);
const router = useRouter();

/**
 * Set the current server in the app
 */
async function setServer(): Promise<void> {
  loading.value = true;

  try {
    await remote.auth.connectServer(serverInfo.PublicAddress);
    await router.push('/server/login');
  } finally {
    loading.value = false;
  }
}
/**
 * Deletes the server from the app
 */
async function removeServer(): Promise<void> {
  await remote.auth.deleteServer(serverInfo.PublicAddress);
}
</script>
