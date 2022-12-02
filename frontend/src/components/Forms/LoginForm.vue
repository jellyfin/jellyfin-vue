<template>
  <div>
    <v-form v-model="valid" :disabled="loading" @submit.prevent="userLogin">
      <v-text-field
        v-if="isEmpty(user)"
        v-model="login.username"
        variant="outlined"
        hide-details
        autofocus
        :label="$t('username')"
        :rules="rules" />
      <v-text-field
        v-model="login.password"
        variant="outlined"
        hide-details
        class="mt-4"
        :label="$t('password')"
        :append-inner-icon="showPassword ? IconEyeOff : IconEye"
        :type="showPassword ? 'text' : 'password'"
        @click:append="() => (showPassword = !showPassword)" />
      <v-checkbox
        v-model="login.rememberMe"
        hide-details
        class="mt-6 mb-6"
        color="primary"
        :label="$t('login.rememberMe')" />
      <v-row align="center" no-gutters>
        <v-col class="mr-2">
          <v-btn v-if="isEmpty(user)" to="/server/select" block size="large">
            {{ $t('login.changeServer') }}
          </v-btn>
          <v-btn v-else block size="large" @click="$emit('change')">
            {{ $t('login.changeUser') }}
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
            {{ $t('signIn') }}
          </v-btn>
        </v-col>
      </v-row>
    </v-form>
  </div>
</template>

<script setup lang="ts">
import { isEmpty } from 'lodash-es';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { UserDto } from '@jellyfin/sdk/lib/generated-client';
import { useRemote } from '@/composables';
import IconEyeOff from '~icons/mdi/eye-off';
import IconEye from '~icons/mdi/eye';

const remote = useRemote();
const { t } = useI18n();

const props = defineProps({
  user: {
    required: true,
    type: Object as () => UserDto
  }
});

defineEmits<{
  (e: 'change'): void;
}>();

const router = useRouter();

const valid = ref(false);
const login = ref({ username: '', password: '', rememberMe: true });
const showPassword = ref(false);
const loading = ref(false);
const rules = [
  (v: string): boolean | string => !!v.trim() || t('validation.required')
];

/**
 * Login the user into the client
 */
async function userLogin(): Promise<void> {
  if (!isEmpty(props.user)) {
    /**
     * If we have a user from the public user selector, set it as login
     */
    login.value.username = props.user.Name || '';
  }

  loading.value = true;

  try {
    await remote.auth.loginUser(
      login.value.username,
      login.value.password,
      login.value.rememberMe
    );

    router.replace('/');
  } finally {
    loading.value = false;
  }
}
</script>
