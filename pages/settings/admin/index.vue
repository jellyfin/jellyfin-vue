<template>
  <settings-page page-title="settings.serverDashboard" no-help>
    <template #content>
      <server-info-card />
    </template>
  </settings-page>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';

export default Vue.extend({
  middleware: 'adminMiddleware',
  head() {
    return {
      title: this.$store.state.page.title
    };
  },
  created() {
    this.setPageTitle({
      title: this.$t('settings.serverDashboard')
    });
  },
  methods: {
    ...mapActions('page', ['setPageTitle'])
  }
});
</script>
