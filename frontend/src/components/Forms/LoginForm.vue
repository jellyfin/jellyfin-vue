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
        autofocus
        hide-details
        :label="$t('username')"
        :rules="rules" />
      <VTextField
        v-model="login.password"
        variant="outlined"
        hide-details
        class="mt-4"
        :label="$t('password')"
        :append-inner-icon="showPassword ? IconEyeOff : IconEye"
        :type="showPassword ? 'text' : 'password'"
        @click:append-inner="() => (showPassword = !showPassword)" />
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
            v-else-if="remote.auth.currentServer?.PublicUsers.length"
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
import IconEye from 'virtual:icons/mdi/eye';
import IconEyeOff from 'virtual:icons/mdi/eye-off';
import { ref, shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { fetchIndexPage } from '@/utils/items';
import { remote } from '@/plugins/remote';
import { jsonConfig } from '@/utils/external-config';

const { user, disabled } = defineProps<{ user?: UserDto; disabled?: boolean }>();

defineEmits<{
  change: [];
}>();

const { t } = useI18n();

const router = useRouter();

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
