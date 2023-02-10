<template>
  <v-card :loading="loading">
    <v-row no-gutters align="center">
      <v-col class="mb-2">
        <v-card-title>{{ serverInfo.ServerName }}</v-card-title>
        <v-card-subtitle class="mt-n2">
          {{ serverInfo.PublicAddress }}
        </v-card-subtitle>
      </v-col>
      <v-col cols="auto">
        <v-card-actions>
          <v-btn icon disabled>
            <v-icon>
              <i-mdi-information-outline />
            </v-icon>
          </v-btn>
          <v-btn
            icon
            :disabled="loading || serverInfo.isDefault"
            @click="removeServer">
            <v-icon>
              <i-mdi-delete />
            </v-icon>
          </v-btn>
          <v-btn icon :disabled="loading" @click="setServer">
            <v-icon>
              <i-mdi-arrow-right />
            </v-icon>
          </v-btn>
        </v-card-actions>
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
// eslint-disable-next-line no-restricted-imports
import { ServerInfo } from '@/plugins/remote/auth/types';
import { useRemote } from '@/composables';

const props = defineProps<{ serverInfo: ServerInfo }>();

const loading = ref(false);
const remote = useRemote();
const router = useRouter();

/**
 * Set the current server in the app
 */
async function setServer(): Promise<void> {
  loading.value = true;

  try {
    await remote.auth.connectServer(props.serverInfo.PublicAddress);
    router.push('/server/login');
  } finally {
    loading.value = false;
  }
}
/**
 * Deletes the server from the app
 */
async function removeServer(): Promise<void> {
  await remote.auth.deleteServer(props.serverInfo.PublicAddress);
}
</script>
