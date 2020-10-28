<template>
  <div>
    <v-form
      ref="form"
      v-model="validInputs"
      :disabled="loginIn"
      @submit.prevent="userLogin"
    >
      <v-text-field
        v-model="serverUrl"
        outlined
        :label="$t('serverAddress')"
        type="url"
        :rules="rules.serverUrlTest"
        required
      ></v-text-field>
      <v-text-field
        v-model="login.username"
        outlined
        :label="$t('username')"
        :rules="[(v) => !!v || $t('usernameRequired')]"
        required
      ></v-text-field>
      <v-text-field
        v-model="login.pw"
        outlined
        :label="$t('password')"
        :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
        :type="showPassword ? 'text' : 'password'"
        @click:append="() => (showPassword = !showPassword)"
      ></v-text-field>
      <v-row align="center" no-gutters>
        <v-col class="mr-2">
          <v-btn
            :disabled="!validInputs"
            :loading="loginIn"
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
      serverUrl: '',
      login: {
        username: '',
        pw: ''
      },
      showPassword: false,
      validInputs: false,
      loginIn: false,
      rules: {
        serverUrlTest: [
          (v: string) => !!v || this.$t('serverAddressRequired'),
          (v: string) =>
            /^https?:\/\/.+/.test(v) || this.$t('serverAddressMustBeUrl')
        ]
      }
    };
  },
  methods: {
    ...mapActions('user', ['setUser', 'setUser']),
    ...mapActions('deviceProfile', ['setDeviceProfile']),
    ...mapActions('snackbar', ['pushSnackbarMessage']),
    async userLogin() {
      this.loginIn = true;
      try {
        this.$axios.setBaseURL(this.serverUrl);

        const response = await this.$auth.loginWith('local', {
          data: this.login
        });

        this.setDeviceProfile();

        const accessToken = `MediaBrowser Client="${this.$store.state.deviceProfile.clientName}", Device="${this.$store.state.deviceProfile.deviceName}", DeviceId="${this.$store.state.deviceProfile.deviceId}", Version="${this.$store.state.deviceProfile.clientVersion}", Token="${response.data.AccessToken}"`;

        this.$auth.setUserToken(accessToken);

        this.$auth.setUser(response.data.User);
        this.setUser({
          id: response.data.User.Id,
          serverUrl: this.serverUrl,
          accessToken
        });
      } catch (error) {
        let errorMessage = this.$t('unexpectedError');

        if (!error.response) {
          errorMessage = this.$t('serverNotFound');
        } else if (
          error.response.status === 500 ||
          error.response.status === 401
        ) {
          errorMessage = this.$t('incorrectUsernameOrPassword');
        } else if (error.response.status === 400) {
          errorMessage = this.$t('badRequest');
        }

        this.loginIn = false;
        this.pushSnackbarMessage({
          message: errorMessage.toString(),
          color: 'error'
        });
      }
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
