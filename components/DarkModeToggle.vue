<template>
  <v-switch v-model="darkMode" :label="$t('darkModeToggle')"></v-switch>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  computed: {
    darkMode: {
      get() {
        return this.$store.getters['displayPreferences/getDarkMode'];
      },
      set(value: boolean) {
        this.$store.dispatch('displayPreferences/setDarkMode', {
          darkMode: value
        });
      }
    }
  }
});
</script>
