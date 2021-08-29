<template>
  <v-card :loading="loading" class="d-flex justify-center">
    <v-row>
      <v-col>
        <v-card-title>{{ serverInfo.publicInfo.ServerName }}</v-card-title>
        <v-card-subtitle>{{ serverInfo.address }}</v-card-subtitle>
      </v-col>
      <v-card-actions class="ml-auto mr-2">
        <v-btn icon disabled>
          <v-icon>mdi-information-outline</v-icon>
        </v-btn>
        <v-btn icon :disabled="loading" @click="removeServerFromStore">
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
import Vue, { PropType } from 'vue';
import { mapActions } from 'vuex';
import { ServerInfo } from '~/store/servers';

export default Vue.extend({
  props: {
    serverInfo: {
      type: Object as PropType<ServerInfo>,
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
    async setServer(): Promise<void> {
      this.loading = true;

      try {
        await this.connectServer(this.serverInfo.address);
        this.$router.push('/server/login');
      } finally {
        this.loading = false;
      }
    },
    removeServerFromStore(): void {
      this.removeServer(this.serverInfo);
    }
  }
});
</script>
