/**
 * Helper for image manipulation and image-related utility functions
 *
 * @mixin
 */
import Vue from 'vue';

const imageHelper = Vue.extend({
  methods: {
    /**
     * Get the URL of an item's image
     * @param id itemId to get image for
     * @param type type of image (primary/backdrop)
     * @returns URL of the link to the image
     */
    getImageLink(id: string, type: string): string {
      return `${this.$axios.defaults.baseURL}/Items/${id}/Images/${type}`;
    }
  }
});

export default imageHelper;
