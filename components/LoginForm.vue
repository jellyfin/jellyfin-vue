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
    <v-alert v-if="errorMessage" class="mt-5" outlined type="error"
      >{{ errorMessage }}
    </v-alert>
  </div>
</template>

<script lang="ts">
export default {
  data() {
    return {
      serverUrl: '',
      login: {
        username: '',
        pw: ''
      },
      showPassword: false,
      errorMessage: '',
      validInputs: false,
      rules: {
        serverUrlTest: [
          (v: string) => !!v || 'Server address is required',
          (v: string) =>
            /^https?:\/\//.test(v) || 'Server address must be a valid URL'
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

        this.$auth.setUser(response.data.User);
        this.$auth.setUserToken(
          // TODO: Generate the token properly
          `MediaBrowser Client="Jellyfin Web", Device="Firefox", DeviceId="TW96aWxsYS81LjAgKFgxMTsgTGludXggeDg2XzY0OyBydjo3Ny4wKSBHZWNrby8yMDEwMDEwMSBGaXJlZm94Lzc3LjB8MTU5NTQ1MTYzMzE4OQ11", Version="10.7.0", Token="${response.data.AccessToken}"`
        );

        this.$auth.setUser(response.data.User);
        this.$router.push('/');
      } catch (error) {
        console.error('Failed to login:', error);

        if (!error.response) {
          this.errorMessage = 'Server Not Found';
        } else if (error.response.status === 500) {
          this.errorMessage = 'Incorrect Password';
        } else if (error.response.status === 400) {
          this.errorMessage = 'Bad Request. Try Again';
        }
      }
    }
  }
};
</script>
