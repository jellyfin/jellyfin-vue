/**
 * Helper for image manipulation and image-related utility functions
 *
 * @mixin
 */
import Vue from 'vue';
import { stringify } from 'qs';
import { BaseItemDto, ImageType } from '~/api';

declare module '@nuxt/types' {
  interface Context {
    getImageUrl: (id: string, type: string) => string;
    getImageUrlForElement: (
      element: HTMLElement,
      item: BaseItemDto,
      type: ImageType
    ) => string;
  }

  interface NuxtAppOptions {
    getImageUrl: (id: string, type: string) => string;
    getImageUrlForElement: (
      element: HTMLElement,
      item: BaseItemDto,
      type: ImageType
    ) => string;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    getImageUrl: (id: string, type: string) => string;
    getImageUrlForElement: (
      element: HTMLElement,
      item: BaseItemDto,
      type: ImageType
    ) => string;
  }
}

const imageHelper = Vue.extend({
  methods: {
    // TODO: Merge getImageUrl and getImageUrlForElement
    /**
     * Returns the URL of an item's image without any options
     *
     * @param {string} id - itemId to get image for
     * @param {string} type - type of image (primary/backdrop)
     * @returns {string} URL of the link to the image
     */
    getImageUrl(id: string, type: string): string {
      return `${this.$axios.defaults.baseURL}/Items/${id}/Images/${type}`;
    },
    /**
     * Returns the URL of an item's image at a specific size.
     *
     * @param {HTMLElement} element The DOM element which size will be used for the image's maximum width or height.
     * @param {BaseItemDto} item The item to fetch the image for.
     * @param {ImageType} type The type of the image to fetch.
     * @param {boolean} [limitByWidth=false] Use the element's width instead of its height for the size calculation.
     * @returns {string} The URL for the image, with the base URL set and the options provided.
     */
    getImageUrlForElement(
      element: HTMLElement,
      item: BaseItemDto,
      type: ImageType,
      limitByWidth = false
    ): string {
      // TODO: Refactor this with an options object
      if (!item) {
        throw new TypeError('item must not be null or undefined');
      }
      if (!item.ImageTags) {
        throw new TypeError('item.ImageTags must not be null or undefined');
      }

      const url = new URL(
        `${this.$axios.defaults.baseURL}/Items/${item.Id}/Images/${type}`
      );

      const params: { [k: string]: string | number | undefined } = {
        tag: item.ImageTags[type],
        quality: 90
      };
      if (limitByWidth) {
        params.maxWidth = element.clientWidth.toString();
      } else {
        params.maxHeight = element.clientHeight.toString();
      }
      url.search = stringify(params);

      return url.toString();
    }
  }
});

export default imageHelper;
