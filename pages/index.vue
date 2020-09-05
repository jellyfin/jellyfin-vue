<template>
  <v-layout column justify-center align-center>
    {{ homeSections }}
  </v-layout>
</template>

<script lang="ts">
import Vue from 'vue';
import { pickBy } from 'lodash';

export default Vue.extend({
  computed: {
    homeSections: {
      get() {
        const homeSections = pickBy(
          this.$store.state.user.displayPreferences,
          (value: string, key: string) => {
            return value && key.startsWith('homesection');
          }
        );

        console.dir(this.$store.state.user.displayPreferences);

        return homeSections;
      }
    }
  }
});
</script>
