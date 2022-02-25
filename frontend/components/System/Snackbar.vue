<template>
  <v-snackbar v-model="model" app :color="snackbar.color" bottom left>
    {{ snackbar.message }}
  </v-snackbar>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapStores } from 'pinia';
import { snackbarStore } from '~/store';

export default Vue.extend({
  data() {
    return {
      model: false
    };
  },
  watch: {
    'snackbar.message': {
      immediate: true,
      handler(newVal: string): void {
        if (newVal !== '') {
          this.model = true;
        }
      }
    },
    model(newVal: boolean): void {
      if (newVal === false) {
        this.snackbar.$reset();
      }
    }
  },
  computed: {
    ...mapStores(snackbarStore)
  }
});
</script>
