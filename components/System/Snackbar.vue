<template>
  <v-snackbar v-model="model" app :color="color" bottom left>
    {{ $t(message) }}
  </v-snackbar>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';

export default Vue.extend({
  data() {
    return {
      model: false,
      color: '',
      message: ''
    };
  },
  mounted() {
    // Empties potential already set buffer
    this.displaySnackbar(
      this.$store.state.snackbar.message,
      this.$store.state.snackbar.color
    );
    this.$store.subscribe((mutation, state) => {
      if (mutation.type === 'snackbar/SET_SNACKBAR_MESSAGE') {
        this.displaySnackbar(state.snackbar.message, state.snackbar.color);
      }
    });
  },
  methods: {
    ...mapActions('snackbar', ['resetMessage']),
    displaySnackbar(message: string, color: string) {
      if (message !== '') {
        this.message = message;
        this.color = color;
        this.model = true;
        this.resetMessage();
      }
    }
  }
});
</script>

<style scoped>
div.v-snack:not(.v-snack--absolute) {
  height: 100%;
}
</style>
