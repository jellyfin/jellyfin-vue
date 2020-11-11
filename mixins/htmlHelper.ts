/**
 * Helper for image manipulation and image-related utility functions
 *
 * @mixin
 */
import Vue from 'vue';
import DOMPurify from 'dompurify';

declare module '@nuxt/types' {
  interface Context {
    sanitizeHtml: (input: string) => string;
  }

  interface NuxtAppOptions {
    sanitizeHtml: (input: string) => string;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    sanitizeHtml: (input: string) => string;
  }
}

const htmlHelper = Vue.extend({
  methods: {
    /**
     * Sanitizes a string containing HTML tags and replaces newlines with the proper HTML tag.
     *
     * @param {string} input - string to sanitize
     * @returns {string} a cleaned up string
     */
    sanitizeHtml(input: string): string {
      console.warn(input);
      // Some providers have newlines, replace them with the proper tag.
      let cleanString = input.replace(/(?:\r\n|\r|\n)/g, '<br>');
      cleanString = DOMPurify.sanitize(cleanString);
      return cleanString;
    }
  }
});

export default htmlHelper;
