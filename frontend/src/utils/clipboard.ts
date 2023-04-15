/**
 * Write text to the clipboard.
 *
 * @param text - The text to write to the clipboard.
 */
export async function writeToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
