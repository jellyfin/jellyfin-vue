<template>
  <v-app>
    <v-main>
      <nuxt />
    </v-main>
    <v-footer app color="rgba(0, 0, 0, 0)">
      <locale-switcher large top />
    </v-footer>
    <snackbar />
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import displayPreferencesHelper from '~/mixins/displayPreferencesHelper';

export default Vue.extend({
  mixins: [displayPreferencesHelper]
});
</script>
