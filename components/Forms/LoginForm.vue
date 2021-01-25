<template>
  <div>
    <validation-observer v-slot="{ invalid }">
      <v-form ref="form" :disabled="loading" @submit.prevent="userLogin">
        <validation-provider
          v-slot="{ errors }"
          name="username"
          :rules="rules.username"
        >
          <v-text-field
            v-if="isEmpty(user)"
            v-model="login.username"
            outlined
            hide-details
            :label="$t('username')"
            :error-messages="errors"
          ></v-text-field>
        </validation-provider>
        <v-text-field
          v-model="login.password"
          outlined
          hide-details
          class="mt-4"
          :label="$t('password')"
          :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          :type="showPassword ? 'text' : 'password'"
          @click:append="() => (showPassword = !showPassword)"
        ></v-text-field>
        <v-checkbox
          v-model="login.rememberMe"
          hide-details
          class="mt-4 mb-8"
          :label="$t('login.rememberMe')"
        ></v-checkbox>
        <v-row align="center" no-gutters>
          <v-col class="mr-2">
            <v-btn v-if="isEmpty(user)" to="/selectServer" nuxt block large>
              {{ $t('login.changeServer') }}
            </v-btn>
            <v-btn v-else block large @click="$emit('change')">
              {{ $t('login.changeUser') }}
            </v-btn>
          </v-col>
          <v-col class="mr-2">
            <v-btn
              :disabled="invalid"
              :loading="loading"
              block
              large
              color="primary"
              type="submit"
            >
              {{ $t('signIn') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-form>
    </validation-observer>
  </div>
</template>

<script lang="ts">
import { isEmpty } from 'lodash';
import Vue from 'vue';
import { mapActions } from 'vuex';
import { UserDto } from '@jellyfin/client-axios';

export default Vue.extend({
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
  methods: {
    ...mapActions('user', ['loginRequest']),
    ...mapActions('deviceProfile', ['setDeviceProfile']),
    ...mapActions('snackbar', ['pushSnackbarMessage']),
    async userLogin(): Promise<void> {
      if (!isEmpty(this.user)) {
        // If we have a user from the public user selector, set it as login
        this.login.username = this.user.Name || '';
      }

      this.loading = true;
      this.setDeviceProfile();
      await this.loginRequest(this.login);
      this.loading = false;
    },
    isEmpty(value: Record<never, never>): boolean {
      return isEmpty(value);
    }
  }
});
</script>

<style scoped>
/* HACK: Snackbar positioning -- See: https://github.com/vuetifyjs/vuetify/issues/11781#issuecomment-655689025 */
div.v-snack:not(.v-snack--absolute) {
  height: 100%;
}
</style>
