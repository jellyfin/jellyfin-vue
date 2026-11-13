<template>
  <!-- One snackbar per message: Vuetify only restarts the timeout when the snackbar opens or its timeout changes, so a
  message replacing another would only get the time left of the first one -->
  <VSnackbar
    :key="state.id"
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
  /**
   * Identifies the message shown: each call of `useSnackbar` shows a new one
   */
  id: number;
  message: string;
  color: string;
  action?: SnackbarAction;
}

const state = reactive<SnackbarState>({
  id: 0,
  message: '',
  color: ''
});

/**
 * Hides the message shown
 */
function close(): void {
  state.message = '';
  state.color = '';
  state.action = undefined;
}

/**
 * Display a notification to the user using a snackbar message located at
 * the bottom left of the frontend, optionally with an action button
 *
 * @returns A function that hides this message, if it's still the one shown (a later message stays), for messages that
 * stop being true before they time out
 */
export function useSnackbar(message: string, color: string, action?: SnackbarAction): () => void {
  const id = state.id + 1;

  state.id = id;
  state.color = color;
  state.message = message;
  state.action = action;

  return () => {
    if (state.id === id) {
      close();
    }
  };
}
</script>

<script setup lang="ts">
const model = computed({
  get: () => state.message !== '',
  set(newValue) {
    if (!newValue) {
      close();
    }
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
