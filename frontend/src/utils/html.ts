/**
 * Helper for HTML manipulation and sanitization
 */
import DOMPurify from 'dompurify';
import { parse } from 'marked';

/**
 * Sanitizes a string containing HTML tags and replaces newlines with the proper HTML tag.
 *
 * @param input - string to sanitize
 * @returns a cleaned up string
 */
export function sanitizeHtml(input: string, isMarkdown = false): string {
  // Some providers have newlines, replace them with the proper tag.
  const cleanString = input.replaceAll(/\r\n|\r|\n/g, '<br>');
  const inputString = isMarkdown ? parse(cleanString, { async: false }) : cleanString;

  return DOMPurify.sanitize(
    inputString,
    {
      USE_PROFILES: { html: true }
    }
  );
}
