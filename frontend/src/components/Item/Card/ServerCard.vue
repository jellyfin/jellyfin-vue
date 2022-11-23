<template>
  <v-card :loading="loading" class="d-flex justify-center">
    <v-row>
      <v-col>
        <v-card-title>{{ serverInfo.ServerName }}</v-card-title>
        <v-card-subtitle>{{ serverInfo.PublicAddress }}</v-card-subtitle>
      </v-col>
      <v-card-actions class="ml-auto mr-2">
        <v-btn icon disabled>
          <v-icon>mdi-information-outline</v-icon>
        </v-btn>
        <v-btn
          icon
          :disabled="loading || serverInfo.isDefault"
          @click="removeServerFromStore">
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
import { defineComponent } from 'vue';
import { ServerInfo } from '@/plugins/vue/remote/auth/types';

export default defineComponent({
  props: {
    serverInfo: {
      type: Object as () => ServerInfo,
      required: true
    }
  },
  data() {
    return {
      loading: false
    };
  },
  methods: {
    async setServer(): Promise<void> {
      this.loading = true;

      try {
        await this.$remote.auth.connectServer(this.serverInfo.PublicAddress);
        this.$router.push('/server/login');
      } finally {
        this.loading = false;
      }
    },
    async removeServerFromStore(): Promise<void> {
      await this.$remote.auth.deleteServer(this.serverInfo.PublicAddress);
    }
  }
});
</script>
