<template>
  <VSnackbar
    v-model="model"
    :color="state.color"
    location="bottom left"
    eager>
    {{ state.message }}
  </VSnackbar>
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
 * Display a notification to the user using a snackbar message located at
 * the bottom left of the frontend
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
    if (!newValue) {
      state.message = '';
      state.color = '';
    }
  }
});
</script>
