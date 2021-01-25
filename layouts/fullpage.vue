<template>
  <v-app>
    <v-main>
      <nuxt />
    </v-main>
    <v-footer app color="rgba(0, 0, 0, 0)">
      <locale-switcher :fab="false" />
    </v-footer>
    <snackbar />
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';

export default Vue.extend({
  beforeMount() {
    this.callAllCallbacks();
  },
  methods: {
    ...mapActions('displayPreferences', ['callAllCallbacks'])
  }
});
</script>
