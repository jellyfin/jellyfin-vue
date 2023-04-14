import { writeText } from '@tauri-apps/api/clipboard';
import { isTauri } from './browser-detection';

/**
 * Write text to the clipboard.
 * With support for both Tauri and the browser native API.
 *
 * @param text - The text to write to the clipboard.
 */
export async function writeToClipboard(text: string): Promise<void> {
  await (isTauri() ? writeText(text) : navigator.clipboard.writeText(text));
}
