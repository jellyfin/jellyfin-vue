/**
 * Helper for image manipulation and image-related utility functions
 *
 * @mixin
 */
import Vue from 'vue';
import { stringify } from 'qs';
import { BaseItemDto, ImageType } from '@jellyfin/client-axios';

declare module '@nuxt/types' {
  interface Context {
    getImageUrlForElement: (
      type: ImageType,
      item?: BaseItemDto,
      element?: HTMLElement,
      tag?: string,
      itemId?: string,
      maxWidth?: number,
      maxHeight?: number,
      quality?: number,
      limitByWidth?: boolean
    ) => string;
    getImageUrlById: (type: ImageType, id: string) => string;
    getSizedImageUrlById: (
      type: ImageType,
      id: string,
      element: HTMLElement
    ) => string;
  }

  interface NuxtAppOptions {
    getImageUrlForElement: (
      type: ImageType,
      item?: BaseItemDto,
      element?: HTMLElement,
      tag?: string,
      itemId?: string,
      maxWidth?: number,
      maxHeight?: number,
      quality?: number,
      limitByWidth?: boolean
    ) => string;
    getImageUrlById: (type: ImageType, id: string) => string;
    getSizedImageUrlById: (
      type: ImageType,
      id: string,
      element: HTMLElement
    ) => string;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    getImageUrlForElement: (
      type: ImageType,
      item?: BaseItemDto,
      element?: HTMLElement,
      tag?: string,
      itemId?: string,
      maxWidth?: number,
      maxHeight?: number,
      quality?: number,
      limitByWidth?: boolean
    ) => string;
    getImageUrlById: (type: ImageType, id: string) => string;
    getSizedImageUrlById: (
      type: ImageType,
      id: string,
      element: HTMLElement
    ) => string;
  }
}

const imageHelper = Vue.extend({
  methods: {
    /**
     * Returns the URL of an item's image:
     * · When 'element' parameter is passed, size of the image will be determined by the element's width & height
     * · When 'maxWidth' and 'maxHeight' parameters are passed, size of the image will be as requested
     * · When no 'element' or 'maxWidth' or 'maxHeight' is provided, image will have the original size.
     *
     * @param {ImageType} type - The type of the image to fetch.
     * @param {BaseItemDto} item - The item to fetch the image for (optional).
     * @param {HTMLElement} element - The DOM element which size will be used for the image's maximum width or height (optional).
     * @param {string} tag - tag of the image to fetch (optional if item is passed).
     * @param {string} itemId - itemId to get the image from (optional if item is passed).
     * @param {number} maxWidth - Maximum width of the image (optional).
     * @param {number} maxHeight - Maximum height of the image (optional).
     * @param {number} quality - Quality level of the image (optional, only relevant for jpeg format).
     * @param {boolean} [limitByWidth=false] - Use the element's width instead of its height for the size calculation.
     * @returns {string} The URL for the image, with the base URL set and the options provided.
     */
    getImageUrlForElement(
      type: ImageType,
      item?: BaseItemDto,
      element?: HTMLElement,
      tag?: string,
      itemId = item?.Id,
      maxWidth = element?.clientWidth.toString(),
      maxHeight = element?.clientHeight.toString(),
      quality = 90,
      limitByWidth = false
    ): string {
      if (item) {
        if (!item.ImageTags) {
          throw new TypeError(
            'item.ImageTags must not be null or undefined when an item object is passed'
          );
        } else if (!tag) {
          tag = item.ImageTags[type];
        }
      } else if (!itemId) {
        throw new TypeError(
          'itemId must not be null or undefined when an item object is not passed'
        );
      }

      const url = new URL(
        `${this.$axios.defaults.baseURL}/Items/${itemId}/Images/${type}`
      );

      const params: { [k: string]: string | number | undefined } = {
        tag,
        quality
      };

      if (limitByWidth && maxWidth) {
        params.maxWidth = maxWidth;
      } else if (maxHeight) {
        params.maxHeight = maxHeight;
      }

      url.search = stringify(params);

      return url.toString();
    },
    /**
     * Shorthand for the 'getImageUrlForElement' function when using an itemId only.
     *
     * @param {ImageType} type - The type of the image to fetch.
     * @param {string} id - iitemId to get the image from.
     * @returns {string} The URL for the image, with the base URL set and the options provided.
     */
    getImageUrlById(type: ImageType, id: string): string {
      return this.getImageUrlForElement(
        type,
        undefined,
        undefined,
        undefined,
        id
      );
    },
    /**
     * Shorthand for the 'getImageUrlForElement' function when using an itemId and a DOM element for size calculations.
     *
     * @param {ImageType} type - The type of the image to fetch.
     * @param {string} id - itemId to get the image from.
     * @param {HTMLElement} element - The DOM element which size will be used for the image's maximum width or height (optional).
     * @returns {string} The URL for the image, with the base URL set and the options provided.
     */
    getSizedImageUrlById(
      type: ImageType,
      id: string,
      element: HTMLElement
    ): string {
      return this.getImageUrlForElement(
        type,
        undefined,
        element,
        undefined,
        id
      );
    }
  }
});

export default imageHelper;
