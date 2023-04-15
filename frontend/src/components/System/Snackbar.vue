<template>
  <v-snackbar v-model="model" :color="state.color" location="bottom left">
    {{ state.message }}
  </v-snackbar>
</template>

<script lang="ts">
import { reactive, computed } from 'vue';

interface SnackbarState {
  message: string;
  color: string;
}

const state = reactive<SnackbarState>({
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
const model = computed({
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
