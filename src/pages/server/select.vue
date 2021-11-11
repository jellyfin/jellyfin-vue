<template>
  <v-container fill-height>
    <v-row align="center" justify="center">
      <v-col sm="6" md="6" lg="5">
        <h1 class="text-h4 mb-6 text-center">
          {{ $t('login.selectServer') }}
        </h1>
        <div v-if="serverList">
          <server-card
            v-for="server in serverList"
            :key="server.publicInfo.Id"
            class="mt-2"
            :server-info="server"
          />
        </div>
        <v-btn
          class="mt-6"
          block
          large
          color="primary"
          @click="$router.push('/server/add')"
        >
          {{ $t('login.addServer') }}
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions, mapState } from 'vuex';

export default Vue.extend({
  layout: 'fullpage',
  auth: false,
  asyncData({ store, redirect }) {
    if (!store.state.servers.serverList.length) {
      redirect('/server/add');
    }
  },
  head() {
    return {
      title: this.title
    };
  },
  computed: {
    ...mapState('servers', ['serverList']),
    ...mapState('page', ['title'])
  },
  watch: {
    serverList(): void {
      if (this.serverList.length === 0) {
        this.$router.push('/server/add');
      }
    }
  },
  mounted() {
    this.setPageTitle({ title: this.$t('login.selectServer') });
  },
  methods: {
    ...mapActions('page', ['setPageTitle'])
  }
});
</script>
