import { useSnackbar, usei18n } from '.';

const { t } = usei18n();

/**
 * Composable for writing content to the clipboard.
 *
 * A simpler version of the useClipboard composable from VueUse.
 * Since this one is only used only to write to clipboard and report success or failure,
 * @param text - The text to write to the clipboard.
 */
export async function useClipboardWrite(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    useSnackbar(t('clipboardSuccess'), 'success');
  } catch (error) {
    console.error(error);
    useSnackbar(t('clipboardFail'), 'error');
  }
}
