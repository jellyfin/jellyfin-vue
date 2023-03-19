/**
 * Helper for image manipulation and image-related utility functions
 *
 */
import DOMPurify from 'dompurify';

/**
 * Sanitizes a string containing HTML tags and replaces newlines with the proper HTML tag.
 *
 * @param input - string to sanitize
 * @returns a cleaned up string
 */
export function sanitizeHtml(input: string): string {
  // Some providers have newlines, replace them with the proper tag.
  const cleanString = input.replace(/\r\n|\r|\n/g, '<br>');

  return DOMPurify.sanitize(cleanString, {
    ALLOWED_TAGS: ['br', 'b', 'strong', 'i', 'em'],
    KEEP_CONTENT: true
  });
}
