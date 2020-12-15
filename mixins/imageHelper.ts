/**
 * Helper for image manipulation and image-related utility functions
 *
 * @mixin
 */
import Vue from 'vue';
import { stringify } from 'qs';
import { BaseItemDto, ImageType } from '@jellyfin/client-axios';

type getImageUrlForElementParams = {
  type: ImageType;
  item?: BaseItemDto;
  element?: HTMLElement;
  tag?: string;
  itemId?: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  limitByWidth?: boolean;
};

declare module '@nuxt/types' {
  interface Context {
    getImageUrlForElement: ({
      type,
      item,
      element,
      tag,
      itemId,
      maxWidth,
      maxHeight,
      quality,
      limitByWidth
    }: getImageUrlForElementParams) => string;
    getImageUrlById: (type: ImageType, id: string) => string;
    getSizedImageUrlById: (
      type: ImageType,
      id: string,
      element: HTMLElement
    ) => string;
  }

  interface NuxtAppOptions {
    getImageUrlForElement: ({
      type,
      item,
      element,
      tag,
      itemId,
      maxWidth,
      maxHeight,
      quality,
      limitByWidth
    }: getImageUrlForElementParams) => string;
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
    getImageUrlForElement: ({
      type,
      item,
      element,
      tag,
      itemId,
      maxWidth,
      maxHeight,
      quality,
      limitByWidth
    }: getImageUrlForElementParams) => string;
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
     * type - The type of the image to fetch.
     * item - The item to fetch the image for (optional).
     * element - The DOM element which size will be used for the image's maximum width or height (optional).
     * tag - tag of the image to fetch (optional if item is passed).
     * [itemId=item?.Id] - itemId to get the image from (optional if item is passed).
     * [maxWidth=element?.clientWidth] - Maximum width of the image (optional).
     * [maxHeight=element?.clientHeight] - Maximum height of the image (optional).
     * [quality=90] - Quality level of the image (optional, only relevant for jpeg format).
     * [limitByWidth=false] - Use the element's width instead of its height for the size calculation.
     *
     * @type {getImageUrlForElementParams}
     * @returns {string} The URL for the image, with the base URL set and the options provided.
     */
    getImageUrlForElement({
      type,
      item,
      element,
      tag,
      itemId = item?.Id,
      maxWidth = element?.clientWidth,
      maxHeight = element?.clientHeight,
      quality = 90,
      limitByWidth = false
    }: getImageUrlForElementParams): string {
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
        params.maxWidth = maxWidth.toString();
      } else if (maxHeight) {
        params.maxHeight = maxHeight.toString();
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
      return this.getImageUrlForElement({
        type,
        itemId: id
      });
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
      return this.getImageUrlForElement({
        type,
        itemId: id,
        element
      });
    }
  }
});

export default imageHelper;
