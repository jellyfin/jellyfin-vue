<template>
  <div>
    <v-form
      ref="form"
      v-model="validInputs"
      :disabled="loading"
      @submit.prevent="userLogin"
    >
      <v-text-field
        v-model="login.username"
        outlined
        :label="$t('username')"
        :rules="[(v) => !!v || $t('usernameRequired')]"
        required
      ></v-text-field>
      <v-text-field
        v-model="login.password"
        outlined
        :label="$t('password')"
        :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
        :type="showPassword ? 'text' : 'password'"
        @click:append="() => (showPassword = !showPassword)"
      ></v-text-field>
      <v-row align="center" no-gutters>
        <v-col class="mr-2">
          <v-btn to="/selectServer" block large
            >{{ $t('changeServer') }}
          </v-btn>
        </v-col>
        <v-col class="mr-2">
          <v-btn
            :disabled="!validInputs"
            :loading="loading"
            block
            large
            color="primary"
            type="submit"
            >{{ $t('signIn') }}</v-btn
          >
        </v-col>
        <v-col cols="auto">
          <locale-switcher />
        </v-col>
      </v-row>
    </v-form>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';

export default Vue.extend({
  data() {
    return {
      login: {
        username: '',
        password: ''
      },
      showPassword: false,
      validInputs: false,
      loading: false
    };
  },
  methods: {
    ...mapActions('user', ['setUser', 'clearUser', 'loginRequest']),
    ...mapActions('deviceProfile', ['setDeviceProfile']),
    ...mapActions('snackbar', ['pushSnackbarMessage']),
    async userLogin() {
      this.loading = true;
      this.setDeviceProfile();
      await this.loginRequest(this.login);
      this.loading = false;
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
