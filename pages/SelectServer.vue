<template>
  <v-container fill-height>
    <v-row align="center" justify="center">
      <v-col sm="6" md="6" lg="5">
        <h1 class="text-h4 mb-6 text-center">{{ $t('selectServer') }}</h1>
        <div v-if="$store.state.servers.serverList">
          <server-card
            v-for="server in $store.state.servers.serverList"
            :key="server.publicInfo.Id"
            :server-info="server"
          ></server-card>
        </div>
        <add-server-form />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';

export default Vue.extend({
  layout: 'fullpage',
  auth: false,
  head() {
    return {
      title: this.$store.state.page.title
    };
  },
  created() {
    this.setPageTitle({ title: this.$t('selectServer') });
  },
  methods: {
    ...mapActions('page', ['setPageTitle'])
  }
});
</script>
