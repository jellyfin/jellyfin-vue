<template>
  <v-container fill-height>
    <v-row align="center" justify="center">
      <v-col sm="6" md="6" lg="5">
        <h1 class="text-h4 mb-6 text-center">
          {{ $t('login.selectServer') }}
        </h1>
        <div>
          <server-card
            v-for="server in auth.servers"
            :key="server.Id"
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

<script lang="ts">
import { defineComponent } from 'vue';
import { mapStores } from 'pinia';
import { authStore, pageStore } from '~/store';

export default defineComponent({
  layout: 'fullpage',
  head() {
    return {
      title: this.page.title
    };
  },
  computed: {
    ...mapStores(pageStore, authStore)
  },
  mounted() {
    this.page.title = this.$t('login.selectServer');
  }
});
</script>
