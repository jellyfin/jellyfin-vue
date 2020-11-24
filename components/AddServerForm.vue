<template>
  <div>
    <v-form
      ref="form"
      v-model="validInputs"
      :disabled="loading"
      @submit.prevent="connectServer"
    >
      <v-text-field
        v-model="serverUrl"
        outlined
        :label="$t('serverAddress')"
        type="url"
        :rules="rules.serverUrlTest"
        required
      ></v-text-field>
      <v-row align="center" no-gutters>
        <v-col class="mr-2">
          <v-btn
            :disabled="!validInputs"
            :loading="loading"
            block
            large
            color="primary"
            type="submit"
            >{{ $t('connect') }}</v-btn
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
import compareVersions from 'compare-versions';

export default Vue.extend({
  data() {
    return {
      serverUrl: '',
      validInputs: false,
      loading: false,
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
    ...mapActions('servers', ['addServer', 'clearServer']),
    ...mapActions('snackbar', ['pushSnackbarMessage']),
    async connectServer() {
      this.loading = true;
      this.$axios.setBaseURL(this.serverUrl);
      try {
        const publicInfo = await this.$api.system.getPublicSystemInfo();
        if (
          compareVersions.compare(publicInfo.data.Version || '', '10.7.0', '>=')
        ) {
          if (!publicInfo.data.StartupWizardCompleted) {
            // Redirect To Startup Wizard
          } else {
            this.addServer({
              publicInfo: publicInfo.data,
              address: this.serverUrl
            });
            this.$router.push('/login');
          }
        } else {
          this.pushSnackbarMessage({
            message: this.$t('serverVersionTooLow'),
            color: 'error'
          });
        }
      } catch (error) {
        this.pushSnackbarMessage({
          message: this.$t('serverNotFound'),
          color: 'error'
        });
      }
      this.loading = false;
    }
  }
});
</script>
