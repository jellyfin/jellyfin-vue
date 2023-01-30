<template>
  <div>
    <v-form
      v-model="valid"
      :disabled="loading"
      @submit.prevent="connectToServer">
      <v-text-field
        v-model="serverUrl"
        variant="outlined"
        autofocus
        :label="$t('login.serverAddress')"
        type="url"
        :rules="rules"
        required />
      <v-row align="center" no-gutters>
        <v-col v-if="previousServerLength" class="mr-2">
          <v-btn block size="large" @click="$router.push('/server/select')">
            {{ $t('login.changeServer') }}
          </v-btn>
        </v-col>
        <v-col class="mr-2">
          <v-btn
            :disabled="!valid"
            :loading="loading"
            block
            size="large"
            color="primary"
            type="submit">
            {{ $t('login.connect') }}
          </v-btn>
        </v-col>
      </v-row>
    </v-form>
  </div>
</template>

<script setup lang="ts">
import { ref, unref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useRemote, useSnackbar } from '@/composables';

const remote = useRemote();
const router = useRouter();
const i18n = useI18n();
const valid = ref(false);
const previousServerLength = unref(remote.auth.servers.length);
const serverUrl = ref('');
const loading = ref(false);

const rules = [
  (v: string): boolean | string => !!v.trim() || i18n.t('validation.required')
];

/**
 * Attempts a connection to the given server
 */
async function connectToServer(): Promise<void> {
  loading.value = true;
  serverUrl.value = serverUrl.value.trim();

  try {
    let candidates = await remote.sdk.discovery.getRecommendedServerCandidates(
      serverUrl.value
    );

    const best = remote.sdk.discovery.findBestServer(candidates);

    if (!best) {
      useSnackbar(i18n.t('login.serverNotFound'), 'error');

      return;
    }

    await remote.auth.connectServer(best.address);

    if (previousServerLength === 0) {
      router.push('/server/login');
    } else {
      router.push('/server/select');
    }
  } finally {
    loading.value = false;
  }
}
</script>
