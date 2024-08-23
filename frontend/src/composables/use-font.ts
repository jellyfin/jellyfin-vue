import { ref } from 'vue';

const currentFont = ref('');

/**
 * Updates the currentFont reactive reference based on the font family of the document body.
 * It retrieves the computed font style of the body and sets the currentFont to the primary font.
 */
const updateFont = () => {
  const body = document.body;
  const style = window.getComputedStyle(body);

  // Remove fallback fonts and quotes around the font name
  const fontFamily = style.fontFamily.split(', ')[0].replaceAll(/["']/g, '');

  currentFont.value = fontFamily;
};

// Event listener to update the font when the font loading is done
document.fonts.addEventListener('loadingdone', () => {
  updateFont();
});

// Initial font retrieval
updateFont();

/**
 * Provides a reactive reference for the current font.
 *
 * @returns An object containing the `currentFont` reactive reference.
 */
export function useFont() {
  return { currentFont };
}
