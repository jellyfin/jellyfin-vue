<template>
  <v-app>
    <v-main>
      <nuxt />
    </v-main>
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
