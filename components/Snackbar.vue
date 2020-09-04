<template>
  <v-snackbar app v-model="model" :color="color" bottom left>
    {{ message }}
  </v-snackbar>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  data() {
    return {
      model: false,
      color: '',
      message: ''
    };
  },
  created() {
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'snackbar/display') {
        this.message = state.snackbar.message;
        this.color = state.snackbar.color;
        this.model = true;
      }
    });
  }
});
</script>

<style scoped>
div.v-snack:not(.v-snack--absolute) {
  height: 100%;
}
</style>
