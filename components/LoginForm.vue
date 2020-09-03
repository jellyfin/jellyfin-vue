<template>
  <v-form @submit.prevent="userLogin">
    <v-text-field
      v-model="serverUrl"
      outlined
      label="Server Address"
      type="url"
    ></v-text-field>
    <v-text-field
      v-model="login.username"
      outlined
      label="Username"
    ></v-text-field>
    <v-text-field
      v-model="login.pw"
      outlined
      label="Password"
      :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
      :type="showPassword ? 'text' : 'password'"
      @click:append="() => (showPassword = !showPassword)"
    ></v-text-field>
    <v-btn block large color="primary" type="submit">submit</v-btn>
  </v-form>
</template>

<script lang="ts">
export default {
  data() {
    return {
      serverUrl: 'http://localhost:8096',
      login: {
        username: '',
        password: ''
      },
      showPassword: false
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
        this.$axios.setToken(
          // TODO: Generate the token properly
          `MediaBrowser Client="Jellyfin Web", Device="Firefox", DeviceId="TW96aWxsYS81LjAgKFgxMTsgTGludXggeDg2XzY0OyBydjo3Ny4wKSBHZWNrby8yMDEwMDEwMSBGaXJlZm94Lzc3LjB8MTU5NTQ1MTYzMzE4OQ11", Version="10.7.0", Token="${response.data.AccessToken}"`,
          'X-Emby-Authorization'
        );
        this.$auth.setUser(response.data.User);
      } catch (err) {
        console.error('Failed to login:', err);
      }
    }
  }
};
</script>
