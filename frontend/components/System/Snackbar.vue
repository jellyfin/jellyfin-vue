<template>
  <v-snackbar v-model="model" app :color="color" bottom left>
    {{ message }}
  </v-snackbar>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapState, mapActions } from 'vuex';

export default Vue.extend({
  data() {
    return {
      model: false
    };
  },
  computed: {
    ...mapState('snackbar', ['message', 'color'])
  },
  watch: {
    message: {
      immediate: true,
      handler(newVal: string): void {
        if (newVal !== '') {
          this.model = true;
        }
      }
    },
    model(newVal: boolean): void {
      if (newVal === false) {
        this.resetMessage();
      }
    }
  },
  methods: {
    ...mapActions('snackbar', ['resetMessage'])
  }
});
</script>
