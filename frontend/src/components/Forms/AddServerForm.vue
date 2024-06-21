<template>
  <div>
    <VForm
      v-model="valid"
      :disabled="loading"
      @submit.prevent="connectToServer">
      <VTextField
        v-model="serverUrl"
        variant="outlined"
        autofocus
        :label="$t('serverAddress')"
        type="url"
        :rules="rules" />
      <VRow
        align="center"
        no-gutters>
        <VCol
          v-if="previousServerLength"
          class="mr-2">
          <VBtn
            v-if="jsonConfig.allowServerSelection"
            block
            size="large"
            variant="elevated"
            @click.prevent="router.push('/server/select')">
            {{ $t('changeServer') }}
          </VBtn>
        </VCol>
        <VCol class="mr-2">
          <VBtn
            :disabled="!valid"
            :loading="loading"
            block
            size="large"
            color="primary"
            variant="elevated"
            type="submit">
            {{ $t('connect') }}
          </VBtn>
        </VCol>
      </VRow>
    </VForm>
  </div>
</template>

<script setup lang="ts">
import { shallowRef, unref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { remote } from '@/plugins/remote';
import { getJSONConfig } from '@/utils/external-config';

const jsonConfig = await getJSONConfig();
const router = useRouter();
const i18n = useI18n();
const valid = shallowRef(false);
const previousServerLength = unref(remote.auth.servers.length);
const serverUrl = shallowRef('');
const loading = shallowRef(false);

const rules = [
  (v: string): boolean | string => !!v.trim() || i18n.t('required')
];

/**
 * Attempts a connection to the given server
 */
async function connectToServer(): Promise<void> {
  loading.value = true;

  try {
    await remote.auth.connectServer(serverUrl.value);

    await (previousServerLength === 0
      ? router.push('/server/login')
      : router.push('/server/select'));
  } finally {
    loading.value = false;
  }
}
</script>
