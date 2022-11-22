<template>
  <div>
    <validation-observer v-slot="{ invalid }">
      <v-form :disabled="loading" @submit.prevent="userLogin">
        <validation-provider
          v-slot="{ errors }"
          name="username"
          :rules="rules.username">
          <v-text-field
            v-if="isEmpty(user)"
            v-model="login.username"
            variant="outlined"
            hide-details
            autofocus
            autocomplete="username"
            :label="$t('username')"
            :error-messages="errors" />
        </validation-provider>
        <v-text-field
          v-model="login.password"
          variant="outlined"
          hide-details
          class="mt-4"
          autocomplete="current-password"
          :label="$t('password')"
          :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          :type="showPassword ? 'text' : 'password'"
          @click:append="() => (showPassword = !showPassword)" />
        <v-checkbox
          v-model="login.rememberMe"
          hide-details
          class="mt-6 mb-6"
          :label="$t('login.rememberMe')" />
        <v-row align="center" no-gutters>
          <v-col class="mr-2">
            <v-btn
              v-if="isEmpty(user)"
              to="/server/select"
              nuxt
              block
              size="large">
              {{ $t('login.changeServer') }}
            </v-btn>
            <v-btn v-else block size="large" @click="$emit('change')">
              {{ $t('login.changeUser') }}
            </v-btn>
          </v-col>
          <v-col class="mr-2">
            <v-btn
              :disabled="invalid"
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
    </validation-observer>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import isEmpty from 'lodash/isEmpty';
import { mapStores } from 'pinia';
import { UserDto } from '@jellyfin/client-axios';
import { authStore } from '~/store';

export default defineComponent({
  props: {
    user: {
      type: Object as () => UserDto,
      default(): UserDto {
        return {};
      }
    }
  },
  data() {
    return {
      login: {
        username: '',
        password: '',
        rememberMe: true
      },
      showPassword: false,
      loading: false,
      rules: {
        username: {
          required: true
        }
      }
    };
  },
  computed: {
    ...mapStores(authStore)
  },
  methods: {
    async userLogin(): Promise<void> {
      if (!isEmpty(this.user)) {
        // If we have a user from the public user selector, set it as login
        this.login.username = this.user.Name || '';
      }

      this.loading = true;

      try {
        await this.auth.loginUser(
          this.login.username,
          this.login.password,
          this.login.rememberMe
        );
      } catch {
      } finally {
        this.loading = false;
      }
    },
    isEmpty(value: Record<never, never>): boolean {
      return isEmpty(value);
    }
  }
});
</script>
