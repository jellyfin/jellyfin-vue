import { useConfirmDialog as confirmDialog } from '@/components/Dialogs/ConfirmDialog.vue';

/**
 * In order to keep the code that tracks the state of the component
 * alongside the component itself, we need the composable
 * to live alongside the component.
 *
 * Thus, this file just exports the useConfirmDialog function from the component
 *
 * @param raiseError - If you want the cancel action to trigger a promise reject
 */
export function useConfirmDialog(
  ...args: Parameters<typeof confirmDialog>
): ReturnType<typeof confirmDialog> {
  return confirmDialog(...args);
}
