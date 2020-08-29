<template>
  <v-card :loading="loading" class="mb-3">
    <v-row>
      <div class="ml-2">
        <v-card-title>{{ serverInfo.ServerName }}</v-card-title>
        <v-card-subtitle>{{ serverInfo.ServerAddress }}</v-card-subtitle>
      </div>
      <v-card-actions class="ml-auto mr-2">
        <v-btn icon>
          <v-icon>mdi-information-outline</v-icon>
        </v-btn>
        <v-btn icon @click="removeServer">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
        <v-btn icon :disabled="loading" @click="setServer">
          <v-icon>mdi-arrow-right</v-icon>
        </v-btn>
      </v-card-actions>
    </v-row>
  </v-card>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';
import compareVersions from 'compare-versions';

export default Vue.extend({
  props: {
    serverInfo: {
      type: Object as () => {
        Id: string;
        ServerAddress: string;
        OperatingSystem: string;
        ProductName: string;
        ServerName: string;
        StartUpWizardCompleted: boolean;
        Version: string;
      },
      required: true
    }
  },
  data() {
    return {
      loading: false
    };
  },
  methods: {
    ...mapActions('snackbar', ['pushSnackbarMessage']),
    ...mapActions('servers', ['setServer', 'clearServer']),
    async setServer() {
      this.loading = true;
      this.$axios.setBaseURL(this.serverInfo.ServerAddress);
      try {
        const publicInfo = await this.$api.system.getPublicSystemInfo();
        if (
          compareVersions.compare(publicInfo.data.Version || '', '10.7.0', '>=')
        ) {
          if (!publicInfo.data.StartupWizardCompleted) {
            // Redirect To Startup Wizard
          } else {
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
    },
    removeServer() {
      this.clearServer();
      console.log(this.$store.state);
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
