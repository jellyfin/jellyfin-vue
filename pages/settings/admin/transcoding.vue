<template>
  <settings-page
    page-title="settingsSections.admin.transcodingAndStreaming.name"
  >
    <template #content>Placeholder for transcode settings</template>
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
      title: this.$t('settingsSections.admin.transcodingAndStreaming.name')
    });
  },
  methods: {
    ...mapActions('page', ['setPageTitle'])
  }
});
</script>
