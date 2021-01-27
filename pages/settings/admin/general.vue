<template>
  <settings-page page-title="settingsSections.admin.general.name">
    <template #content>Placeholder for general settings</template>
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
      title: this.$t('settingsSections.admin.general.name')
    });
  },
  methods: {
    ...mapActions('page', ['setPageTitle'])
  }
});
</script>
