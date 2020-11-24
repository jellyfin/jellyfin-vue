<template>
  <v-container fill-height>
    <v-row align="center" justify="center">
      <v-col md="4">
        <h1 class="text-h4 mb-6 text-center">{{ $t('login') }}</h1>
        <login-form />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';

export default Vue.extend({
  layout: 'fullpage',
  middleware: 'serverMiddleware',
  head() {
    return {
      title: this.$store.state.page.title
    };
  },
  created() {
    this.setPageTitle({ title: this.$t('login') });
  },
  methods: {
    ...mapActions('page', ['setPageTitle'])
  }
});
</script>
