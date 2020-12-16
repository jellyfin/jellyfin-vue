/**
 * Helper for image manipulation and image-related utility functions
 *
 * @mixin
 */
import Vue from 'vue';
import { stringify } from 'qs';
import { BaseItemDto, ImageType } from '@jellyfin/client-axios';

type ImageUrlForElementParams = {
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
    getImageUrlForElement: (
      type: ImageType,
      {
        item,
        element,
        tag,
        itemId,
        maxWidth,
        maxHeight,
        quality,
        limitByWidth
      }: ImageUrlForElementParams
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
      {
        item,
        element,
        tag,
        itemId,
        maxWidth,
        maxHeight,
        quality,
        limitByWidth
      }: ImageUrlForElementParams
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
      {
        item,
        element,
        tag,
        itemId,
        maxWidth,
        maxHeight,
        quality,
        limitByWidth
      }: ImageUrlForElementParams
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
     * @param {object} options - Optional parameters for the function.
     * @param {BaseItemDto} options.item - The item to fetch the image for (optional).
     * @param {HTMLElement} options.element - The DOM element which size will be used for the image's maximum width or height (optional).
     * @param {string} options.tag - tag of the image to fetch (optional if item is passed).
     * @param {string} [options.itemId=item?.Id] - itemId to get the image from (optional if item is passed).
     * @param {number} [options.maxWidth=element?.clientWidth] - Maximum width of the image (optional).
     * @param {number} [options.maxHeight=element?.clientHeight] - Maximum height of the image (optional).
     * @param {number} [options.quality=90] - Quality level of the image (optional, only relevant for jpeg format).
     * @param {boolean} [options.limitByWidth=false] - Use the element's width instead of its height for the size calculation.
     * @returns {string} The URL for the image, with the base URL set and the options provided.
     */
    getImageUrlForElement(
      type: ImageType,
      {
        item,
        element,
        tag,
        itemId = item?.Id,
        maxWidth = element?.clientWidth,
        maxHeight = element?.clientHeight,
        quality = 90,
        limitByWidth = false
      }: ImageUrlForElementParams
    ): string {
      if (item) {
        if (!item.ImageTags) {
          throw new TypeError(
            'item.ImageTags must not be null or undefined when an item object is passed'
          );
        }
        tag = item?.ImageTags?.[type];
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
    }
  }
});

export default imageHelper;
