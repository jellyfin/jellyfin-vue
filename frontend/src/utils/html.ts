/**
 * Helper for image manipulation and image-related utility functions
 *
 */
import DOMPurify from 'dompurify';
import { decode } from 'he';

/**
 * Sanitizes a string containing HTML tags and replaces newlines with the proper HTML tag.
 *
 * @param {string} input - string to sanitize
 * @returns {string} a cleaned up string
 */
export function sanitizeHtml(input: string): string {
  // Some providers have newlines, replace them with the proper tag.
  let cleanString = decode(input).replace(/(?:\r\n|\r|\n)/g, '<br>');

  cleanString = DOMPurify.sanitize(cleanString, {
    ALLOWED_TAGS: ['br', 'b', 'strong', 'i', 'em'],
    KEEP_CONTENT: true
  });

  return cleanString;
}
