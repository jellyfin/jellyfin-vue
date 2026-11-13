<template>
  <VSnackbar
    v-model="model"
    :color="state.color"
    :timeout="state.action ? -1 : undefined"
    location="bottom left"
    eager>
    {{ state.message }}
    <template
      v-if="state.action"
      #actions>
      <button
        type="button"
        class="uno-font-medium uno-px-2 uno-py-1 uno-cursor-pointer uno-uppercase hover:uno-opacity-80"
        @click="runAction">
        {{ state.action.text }}
      </button>
      <button
        type="button"
        class="uno-p-1 uno-flex uno-cursor-pointer hover:uno-opacity-80"
        :aria-label="$t('close')"
        @click="model = false">
        <JIcon class="i-mdi:close" />
      </button>
    </template>
  </VSnackbar>
</template>

<script lang="ts">
import { reactive, computed } from 'vue';

/**
 * A button of the snackbar. A snackbar with an action stays until the action is taken or it's closed.
 */
interface SnackbarAction {
  text: string;
  onClick: () => void;
}

interface SnackbarState {
  message: string;
  color: string;
  action?: SnackbarAction;
}

const state = reactive<SnackbarState>({
  message: '',
  color: ''
});

/**
 * Display a notification to the user using a snackbar message located at
 * the bottom left of the frontend, optionally with an action button
 */
export function useSnackbar(message: string, color: string, action?: SnackbarAction): void {
  state.color = color;
  state.message = message;
  state.action = action;
}
</script>

<script setup lang="ts">
const model = computed({
  get: () => state.message !== '',
  set(newValue) {
    if (newValue) {
      return;
    }

    state.message = '';
    state.color = '';
    state.action = undefined;
  }
});

/**
 * Takes the action and closes the snackbar
 */
function runAction(): void {
  const action = state.action;

  model.value = false;
  action?.onClick();
}
</script>
