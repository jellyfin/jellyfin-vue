<template>
  <v-switch v-model="darkMode" :label="$t('darkModeToggle')"></v-switch>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapGetters, mapActions } from 'vuex';

export default Vue.extend({
  computed: {
    ...mapGetters('displayPreferences', ['getDarkMode']),
    darkMode: {
      get() {
        return this.getDarkMode;
      },
      set(value: boolean) {
        this.setDarkMode({ darkMode: value });
      }
    }
  },
  methods: {
    ...mapActions('displayPreferences', ['setDarkMode'])
  }
});
</script>
