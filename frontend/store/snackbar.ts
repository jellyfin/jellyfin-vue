import { defineStore } from 'pinia';

export interface SnackbarState {
  message: string;
  color: string;
}

export const snackbarStore = defineStore('snackbar', {
  state: (): SnackbarState => {
    return {
      message: '',
      color: ''
    };
  },
  actions: {
    /**
     * Pushes a new snackbar message
     *
     * @param message
     * @param color
     */
    push(message: string, color: string): void {
      this.message = message;
      this.color = color;
    }
  }
});
