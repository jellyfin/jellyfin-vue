<template>
  <v-container fill-height>
    <v-row align="center" justify="center">
      <v-col md="4">
        <h1 class="text-h4 mb-6 text-center">Login</h1>
        <login-form />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  layout: 'fullpage'
});
</script>
