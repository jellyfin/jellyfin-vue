import { useConfirmDialog as confirmDialog } from '@/components/Dialogs/ConfirmDialog.vue';

/**
 * In order to keep the code that tracks the state of the component
 * alongside the component itself, we need the composable
 * to live alongside the component.
 *
 * Thus, this file just exports the useSnackbar function from the component
 */
export function useConfirmDialog(
  ...args: Parameters<typeof confirmDialog>
): ReturnType<typeof confirmDialog> {
  return confirmDialog(...args);
}
