<template>
  <v-snackbar
    v-model="model"
    app
    :color="snackbar.color"
    location="bottom"
    location="left">
    {{ snackbar.message }}
  </v-snackbar>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapStores } from 'pinia';
import { snackbarStore } from '~/store';

export default defineComponent({
  data() {
    return {
      model: false
    };
  },
  computed: {
    ...mapStores(snackbarStore)
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
  }
});
</script>
