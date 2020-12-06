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
    getImageUrlForElement: (
      item: BaseItemDto,
      type: ImageType,
      element?: HTMLElement,
      limitByWidth?: boolean
    ) => string;
  }

  interface NuxtAppOptions {
    getImageUrlForElement: (
      item: BaseItemDto,
      type: ImageType,
      element?: HTMLElement,
      limitByWidth?: boolean
    ) => string;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    getImageUrlForElement: (
      item: BaseItemDto,
      type: ImageType,
      element?: HTMLElement,
      limitByWidth?: boolean
    ) => string;
  }
}

const imageHelper = Vue.extend({
  methods: {
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
      item: BaseItemDto,
      type: ImageType,
      element?: HTMLElement,
      limitByWidth = false
    ): string {
      // TODO: Refactor this with an options object
      if (!item) {
        throw new TypeError('item must not be null or undefined');
      }

      let itemId;
      if (item.Type === 'Episode' && type === ImageType.Thumb) {
        itemId = item.SeriesId;
        if (item.SeriesThumbImageTag) {
          type = ImageType.Thumb;
        } else {
          type = ImageType.Backdrop;
        }
      } else if (item.Type === 'Episode' && type === ImageType.Backdrop) {
        itemId = item.SeriesId;
      } else if (item.Type === 'Audio' && type === ImageType.Backdrop) {
        itemId = item.AlbumArtists?.[0].Id;
      } else {
        itemId = item.Id;
      }

      const url = new URL(
        `${this.$axios.defaults.baseURL}/Items/${itemId}/Images/${type}`
      );

      let imageTag;
      if (item.Type === 'Episode' && type === ImageType.Thumb) {
        if (item.SeriesThumbImageTag) {
          imageTag = item.SeriesThumbImageTag;
        } else {
          imageTag = item.ParentBackdropImageTags?.[0];
        }
      } else if (item.Type === 'Episode' && type === ImageType.Backdrop) {
        imageTag = item.ParentBackdropImageTags?.[0];
      } else {
        imageTag = item.ImageTags?.[type];
      }

      const params: { [k: string]: string | number | undefined } = {
        tag: imageTag,
        quality: 90
      };

      if (element && limitByWidth) {
        params.maxWidth = element.clientWidth.toString();
      } else if (element) {
        params.maxHeight = element.clientHeight.toString();
      }

      url.search = stringify(params);

      return url.toString();
    }
  }
});

export default imageHelper;
