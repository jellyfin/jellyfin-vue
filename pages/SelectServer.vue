<template>
  <v-container fill-height>
    <v-row align="center" justify="center">
      <v-col md="4">
        <h1 class="text-h4 mb-6 text-center">{{ $t('selectServer') }}</h1>
        <server-card
          v-if="$store.state.servers.Id"
          :server-info="$store.state.servers"
        ></server-card>
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
