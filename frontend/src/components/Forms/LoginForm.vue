<template>
  <div>
    <VForm
      v-model="valid"
      :disabled="loading || disabled"
      @submit.prevent="userLogin">
      <VTextField
        v-if="!user"
        v-model="login.username"
        variant="outlined"
        hide-details
        autofocus
        :label="$t('username')"
        :rules="rules" />
      <VTextField
        v-model="login.password"
        variant="outlined"
        hide-details
        class="mt-4"
        :label="$t('password')"
        :type="showPassword ? 'text' : 'password'">
        <template #append-inner>
          <JIcon
            :class="showPassword ? 'i-mdi:eye-off' : 'i-mdi:eye'"
            @click.passive="() => (showPassword = !showPassword)" />
        </template>
      </VTextField>
      <VCheckbox
        v-model="login.rememberMe"
        hide-details
        class="mb-6 mt-6"
        color="primary"
        :label="$t('rememberMe')" />
      <VRow
        align="center"
        no-gutters>
        <VCol class="mr-2">
          <VBtn
            v-if="!user && jsonConfig.allowServerSelection"
            to="/server/select"
            block
            size="large"
            variant="elevated"
            @click.prevent>
            {{ $t('changeServer') }}
          </VBtn>
          <VBtn
            v-else-if="remote.auth.currentServer.value?.PublicUsers.length"
            block
            size="large"
            variant="elevated"
            @click.prevent="$emit('change')">
            {{ $t('changeUser') }}
          </VBtn>
        </VCol>
        <VCol class="mr-2">
          <VBtn
            :disabled="!valid || disabled"
            :loading="loading"
            block
            size="large"
            color="primary"
            variant="elevated"
            type="submit">
            {{ $t('signIn') }}
          </VBtn>
        </VCol>
      </VRow>
    </VForm>
  </div>
</template>

<script setup lang="ts">
import type { UserDto } from '@jellyfin/sdk/lib/generated-client';
import { ref, shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { fetchIndexPage } from '#/utils/items';
import { remote } from '#/plugins/remote';
import { jsonConfig } from '#/utils/external-config';

const { user, disabled } = defineProps<{ user?: UserDto; disabled?: boolean }>();

defineEmits<{
  change: [];
}>();

const { t } = useI18n();

const valid = shallowRef(false);
const login = ref({ username: '', password: '', rememberMe: true });
const showPassword = shallowRef(false);
const loading = shallowRef(false);
const rules = [
  (v: string): boolean | string => !!v.trim() || t('required')
];

/**
 * Login the user into the client
 */
async function userLogin(): Promise<void> {
  if (user) {
    /**
     * If we have a user from the public user selector, set it as login
     */
    login.value.username = user.Name ?? '';
  }

  loading.value = true;

  try {
    await remote.auth.loginUser(
      login.value.username,
      login.value.password,
      login.value.rememberMe
    );

    /**
     * We fetch all the default layout data here to keep the "login" button
     * loading spinner active until we redirect the user.
     */
    await fetchIndexPage();
  } catch {
    loading.value = false;
  }
}
</script>
