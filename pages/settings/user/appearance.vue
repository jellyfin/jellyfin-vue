<template>
  <settings-page page-title="settingsSections.user.appearance.name">
    <template #content>Placeholder for appearance settings</template>
  </settings-page>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';

export default Vue.extend({
  head() {
    return {
      title: this.$store.state.page.title
    };
  },
  created() {
    this.setPageTitle({
      title: this.$t('settingsSections.user.appearance.name')
    });
  },
  methods: {
    ...mapActions('page', ['setPageTitle'])
  }
});
</script>
