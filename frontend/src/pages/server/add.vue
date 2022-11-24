<template>
  <v-container fill-height>
    <v-row align="center" justify="center">
      <v-col sm="6" md="6" lg="5">
        <h1 class="text-h4 mb-6 text-center">
          {{ $t('login.addServer') }}
        </h1>
        <add-server-form />
      </v-col>
    </v-row>
  </v-container>
</template>

<route lang="yaml">
meta:
  layout: fullpage
</route>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const route = useRoute();

route.meta.title = t('login.addServer');
</script>
