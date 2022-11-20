import { useSnackbar as snackbar } from '@/components/System/Snackbar.vue';

/**
 * In order to keep the code that tracks the state of the component
 * alongside the component itself, we need the composable
 * to live alongside the component.
 *
 * Thus, this file just exports the useSnackbar function from the component
 */
export function useSnackbar(...args: Parameters<typeof snackbar>): void {
  snackbar(...args);
}
