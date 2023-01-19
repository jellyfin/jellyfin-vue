<template>
  <v-container class="fill-height" fluid>
    <v-row justify="center">
      <v-col sm="6" md="6" lg="5">
        <h1 class="text-h4 mb-6 text-center">
          {{ $t('login.selectServer') }}
        </h1>
        <div>
          <server-card
            v-for="server in $remote.auth.servers.value"
            :key="server.Id || v4()"
            class="mt-2"
            :server-info="server" />
        </div>
        <v-btn
          class="mt-6"
          block
          size="large"
          color="primary"
          @click="$router.push('/server/add')">
          {{ $t('login.addServer') }}
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<route lang="yaml">
meta:
  layout: server
</route>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { v4 } from 'uuid';

const { t } = useI18n();
const route = useRoute();

route.meta.title = t('login.selectServer');
</script>
