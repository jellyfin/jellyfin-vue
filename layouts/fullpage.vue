<template>
  <v-app dark>
    <v-main>
      <nuxt />
    </v-main>
    <snackbar />
  </v-app>
</template>

<script lang="ts">
import Snackbar from '~/components/Snackbar.vue';

export default {
  components: { Snackbar }
};
</script>
