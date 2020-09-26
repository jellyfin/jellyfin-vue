<template>
  <v-snackbar v-model="model" app :color="color" bottom left>
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
      if (mutation.type === 'snackbar/SET_SNACKBAR_MESSAGE') {
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
