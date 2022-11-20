<template>
  <v-snackbar v-model="model" app :color="state.color" location="bottom left">
    {{ state.message }}
  </v-snackbar>
</template>

<script lang="ts">
import { reactive, computed } from 'vue';

interface SnackbarState {
  message: string;
  color: string;
}

let state: SnackbarState = reactive({
  message: '',
  color: ''
});

/**
 * Composable for invoking snackbar message
 */
export function useSnackbar(message: string, color: string): void {
  state.color = color;
  state.message = message;
}
</script>

<script setup lang="ts">
const model = computed<boolean>({
  get() {
    return state.message !== '';
  },
  set(newValue) {
    if (newValue === false) {
      state.message = '';
      state.color = '';
    }
  }
});
</script>
