<template>
  <settings-page page-title="settingsSections.user.home.name">
    <template #content>Placeholder for home settings</template>
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
      title: this.$t('settingsSections.user.home.name')
    });
  },
  methods: {
    ...mapActions('page', ['setPageTitle'])
  }
});
</script>
