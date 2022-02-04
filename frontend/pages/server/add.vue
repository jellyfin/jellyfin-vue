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

<script lang="ts">
import Vue from 'vue';
import { mapActions, mapState } from 'vuex';

export default Vue.extend({
  layout: 'fullpage',
  auth: false,
  head() {
    return {
      title: this.title
    };
  },
  computed: {
    ...mapState('page', ['title'])
  },
  mounted() {
    this.setPageTitle({ title: this.$t('login.addServer') });
  },
  methods: {
    ...mapActions('page', ['setPageTitle'])
  }
});
</script>
