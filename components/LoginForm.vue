<template>
  <div>
    <v-form ref="form" v-model="validInputs" @submit.prevent="userLogin">
      <v-text-field
        v-model="serverUrl"
        outlined
        label="Server Address"
        type="url"
        :rules="rules.serverUrlTest"
        required
      ></v-text-field>
      <v-text-field
        v-model="login.username"
        outlined
        label="Username"
        :rules="[(v) => !!v || 'Username is required']"
        required
      ></v-text-field>
      <v-text-field
        v-model="login.pw"
        outlined
        label="Password"
        :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
        :type="showPassword ? 'text' : 'password'"
        @click:append="() => (showPassword = !showPassword)"
      ></v-text-field>
      <v-btn :disabled="!validInputs" block large color="primary" type="submit"
        >submit</v-btn
      >
    </v-form>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

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
      rules: {
        serverUrlTest: [
          (v: string) => !!v || 'Server address is required',
          (v: string) =>
            /^https?:\/\/.+/.test(v) || 'Server address must be a valid URL'
        ]
      }
    };
  },
  methods: {
    async userLogin() {
      try {
        this.$axios.setBaseURL(this.serverUrl);

        const response = await this.$auth.loginWith('local', {
          data: this.login
        });

        this.$auth.setUserToken(
          // TODO: Generate the token properly
          `MediaBrowser Client="Jellyfin Web", Device="Firefox", DeviceId="TW96aWxsYS81LjAgKFgxMTsgTGludXggeDg2XzY0OyBydjo3Ny4wKSBHZWNrby8yMDEwMDEwMSBGaXJlZm94Lzc3LjB8MTU5NTQ1MTYzMzE4OQ11", Version="10.7.0", Token="${response.data.AccessToken}"`
        );
        this.$auth.setUser(response.data.User);
      } catch (error) {
        let errorMessage = 'Unexpected Error';

        if (!error.response) {
          errorMessage = 'Server Not Found';
        } else if (error.response.status === 500) {
          errorMessage = 'Incorrect Password';
        } else if (error.response.status === 400) {
          errorMessage = 'Bad Request. Try Again';
        }

        this.$snackbar(errorMessage, 'error');
      }
    }
  }
});
</script>

<style scoped>
div.v-snack:not(.v-snack--absolute) {
  height: 100%;
}
</style>
