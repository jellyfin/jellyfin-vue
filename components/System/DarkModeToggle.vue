<template>
  <v-switch v-model="darkMode" :label="$t('darkModeToggle')"></v-switch>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapGetters, mapActions } from 'vuex';

export default Vue.extend({
  computed: {
    ...mapGetters('displayPreferences', ['getBooleanCustomPref']),
    darkMode: {
      get(): boolean {
        return this.getBooleanCustomPref('darkMode');
      },
      set(value: boolean): void {
        this.editBooleanCustomPref({ key: 'darkMode', value });
      }
    }
  },
  methods: {
    ...mapActions('displayPreferences', ['editBooleanCustomPref'])
  }
});
</script>
