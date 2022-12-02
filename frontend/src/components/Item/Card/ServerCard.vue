<template>
  <v-card :loading="loading" class="d-flex justify-center">
    <v-row>
      <v-col>
        <v-card-title>{{ serverInfo.ServerName }}</v-card-title>
        <v-card-subtitle>{{ serverInfo.PublicAddress }}</v-card-subtitle>
      </v-col>
      <v-card-actions class="ml-auto mr-2">
        <v-btn icon disabled>
          <Icon>
            <i-mdi-information-outline />
          </Icon>
        </v-btn>
        <v-btn
          icon
          :disabled="loading || serverInfo.isDefault"
          @click="removeServer">
          <Icon>
            <i-mdi-delete />
          </Icon>
        </v-btn>
        <v-btn icon :disabled="loading" @click="setServer">
          <Icon>
            <i-mdi-arrow-right />
          </Icon>
        </v-btn>
      </v-card-actions>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
// eslint-disable-next-line no-restricted-imports
import { ServerInfo } from '@/plugins/vue/remote/auth/types';
import { useRemote } from '@/composables';

const props = defineProps({
  serverInfo: {
    type: Object as () => ServerInfo,
    required: true
  }
});

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
