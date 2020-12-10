<template>
  <v-card :loading="loading" class="mb-3">
    <v-row>
      <div class="ml-2">
        <v-card-title>{{ serverInfo.publicInfo.ServerName }}</v-card-title>
        <v-card-subtitle>{{ serverInfo.address }}</v-card-subtitle>
      </div>
      <v-card-actions class="ml-auto mr-2">
        <v-btn icon>
          <v-icon>mdi-information-outline</v-icon>
        </v-btn>
        <v-btn icon @click="removeServerFromStore">
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
import { PublicSystemInfo } from '@jellyfin/client-axios';

export default Vue.extend({
  props: {
    serverInfo: {
      type: Object as () => {
        address: string;
        publicInfo: PublicSystemInfo;
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
    ...mapActions('servers', ['connectServer', 'removeServer']),
    async setServer() {
      // TODO: Merge with the identical method in AddServerForm
      this.loading = true;
      await this.connectServer(this.serverInfo.address);
      this.loading = false;
    },
    removeServerFromStore() {
      this.removeServer(this.serverInfo);
    }
  }
});
</script>
