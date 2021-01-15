/**
 * Helper for image manipulation and image-related utility functions
 *
 * @mixin
 */
import Vue from 'vue';
import { stringify } from 'qs';
import { BaseItemDto, BaseItemPerson, ImageType } from '@jellyfin/client-axios';

type ImageUrlForElementParams = {
  item?: BaseItemDto;
  element?: HTMLElement;
  tag?: string;
  itemId?: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  limitByWidth?: boolean;
  backdropIndex?: number;
  checkParent?: boolean;
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
        limitByWidth,
        backdropIndex,
        checkParent
      }: ImageUrlForElementParams
    ) => string | undefined;
    getParentId(item: BaseItemDto): string | undefined;
    getImageTag(
      item: BaseItemDto | BaseItemPerson,
      type: ImageType,
      index?: number,
      checkParent?: boolean
    ): string | undefined;
    getBlurhash(
      item: BaseItemDto | BaseItemPerson,
      type: ImageType,
      index?: number,
      checkParent?: boolean
    ): string | undefined;
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
        limitByWidth,
        backdropIndex,
        checkParent
      }: ImageUrlForElementParams
    ) => string | undefined;
    getParentId(item: BaseItemDto): string | undefined;
    getImageTag(
      item: BaseItemDto | BaseItemPerson,
      type: ImageType,
      index?: number,
      checkParent?: boolean
    ): string | undefined;
    getBlurhash(
      item: BaseItemDto | BaseItemPerson,
      type: ImageType,
      index?: number,
      checkParent?: boolean
    ): string | undefined;
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
        limitByWidth,
        backdropIndex,
        checkParent
      }: ImageUrlForElementParams
    ) => string | undefined;
    getParentId(item: BaseItemDto): string | undefined;
    getImageTag(
      item: BaseItemDto | BaseItemPerson,
      type: ImageType,
      index?: number,
      checkParent?: boolean
    ): string | undefined;
    getBlurhash(
      item: BaseItemDto | BaseItemPerson,
      type: ImageType,
      index?: number,
      checkParent?: boolean
    ): string | undefined;
  }
}

/**
 * Checks if the passed object is BaseItemDto or BaseItemPerson
 *
 * @param {BaseItemDto|BaseItemPerson} obj - The object to check
 * @returns {boolean} Returns true if the object is a person, false otherwise.
 */
function isPerson(obj: BaseItemDto | BaseItemPerson): obj is BaseItemPerson {
  return (obj as BaseItemPerson)?.Role !== undefined;
}

const excludedBlurhashTypes = [ImageType.Logo];

const imageHelper = Vue.extend({
  methods: {
    /**
     * Gets the tag of the image of an specific item and type.
     *
     * @param {BaseItemDto|BaseItemPerson} item - The item object.
     * @param {ImageType} type - The type of the image requested.
     * @param {number} [index=0] - Index of the Backdrop image (when ImageType equals to 'Backdrop').
     * @param {boolean} [checkParent=true] - Looks for tag/image type for the parent if the passed item doesn't have the ImageType requested
     * @returns {string|undefined} Returns the tag, undefined if the specific ImageType doesn't exist.
     */
    getImageTag(
      item: BaseItemDto | BaseItemPerson,
      type: ImageType,
      index = 0,
      checkParent = true
    ): string | undefined {
      if (!item) {
        return;
      }

      if (isPerson(item)) {
        if (item.PrimaryImageTag && type === ImageType.Primary) {
          return item.PrimaryImageTag;
        } else {
          return;
        }
      }

      if (item.ImageTags?.[type]) {
        return item.ImageTags?.[type];
      } else if (
        type === ImageType.Backdrop &&
        item.BackdropImageTags?.[index]
      ) {
        return item.BackdropImageTags[index];
      }

      if (checkParent) {
        switch (type) {
          case ImageType.Primary:
            if (item.AlbumPrimaryImageTag) {
              return item.AlbumPrimaryImageTag;
            } else if (item.ChannelPrimaryImageTag) {
              return item.ChannelPrimaryImageTag;
            } else if (item.ParentPrimaryImageTag) {
              return item.ParentPrimaryImageTag;
            }
            break;
          case ImageType.Art:
            if (item.ParentArtImageTag) {
              return item.ParentArtImageTag;
            }
            break;
          case ImageType.Backdrop:
            if (item.ParentBackdropImageTags?.[index]) {
              return item.ParentBackdropImageTags[index];
            }
            break;
          case ImageType.Logo:
            if (item.ParentLogoImageTag) {
              return item.ParentLogoImageTag;
            }
            break;
          case ImageType.Thumb:
            if (item.ParentThumbImageTag) {
              return item.ParentThumbImageTag;
            }
            break;
          default:
            return undefined;
        }
      }
    },
    /**
     * Gets the itemId of the parent element.
     *
     * @param {BaseItemDto} item - The item object.
     * @returns {string|undefined} Returns the parent itemId, undefined if it doesn't exist.
     */
    getParentId(item: BaseItemDto): string | undefined {
      if (item.AlbumId) {
        return item.AlbumId;
      } else if (item.ChannelId) {
        return item.ChannelId;
      } else if (item.SeriesId) {
        return item.SeriesId;
      } else if (item.ParentArtItemId) {
        return item.ParentArtItemId;
      } else if (item.ParentPrimaryImageItemId) {
        return item.ParentPrimaryImageItemId;
      } else if (item.ParentThumbItemId) {
        return item.ParentThumbItemId;
      } else if (item.ParentBackdropItemId) {
        return item.ParentBackdropItemId;
      } else if (item.ParentLogoItemId) {
        return item.ParentLogoItemId;
      } else if (item.SeasonId) {
        return item.SeasonId;
      } else if (item.ParentId) {
        return item.ParentId;
      }
    },
    /**
     * Gets the blurhash string of an image given the item and the image type desired.
     *
     * @param {BaseItemDto|BaseItemPerson} item - The item object.
     * @param {ImageType} type - The type of the image requested.
     * @param {number} [index=0] - Index of the Backdrop image (when ImageType equals to 'Backdrop').
     * @param {number} [checkParent=true] - Checks for the parent's images blurhash (in case the provided item doesn't have it)
     * @returns {string|undefined} Returns the tag, undefined if the specific ImageType doesn't exist.
     */
    getBlurhash(
      item: BaseItemDto | BaseItemPerson,
      type: ImageType,
      index = 0,
      checkParent = true
    ): string | undefined {
      if (item) {
        const tag = this.getImageTag(item, type, index, checkParent);
        if (
          tag &&
          !excludedBlurhashTypes.includes(type) &&
          item.ImageBlurHashes?.[type]?.[tag]
        ) {
          return item.ImageBlurHashes?.[type]?.[tag];
        }
      }
    },
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
     * @param {number} [options.maxWidth=element?.clientWidth] - Maximum width of the image in CSS pixels (optional).
     * @param {number} [options.maxHeight=element?.clientHeight] - Maximum height of the image in CSS pixels (optional).
     * @param {number} [options.quality=90] - Quality level of the image (optional, only relevant for jpeg format).
     * @param {boolean} [options.limitByWidth=false] - Use the element's width instead of its height for the size calculation.
     * @param {number} [options.backdropIndex=0] - Index of the backdrop image to use (when image type is 'Backdrop').
     * @param {boolean} [options.checkParent=true] - If it's needed to look for the parent's image tags in case the item's requested image type/tag doesn't exist.
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
        limitByWidth = false,
        backdropIndex = 0,
        checkParent = true
      }: ImageUrlForElementParams
    ): string | undefined {
      if (item) {
        if (!tag) {
          tag = this.getImageTag(item, type, backdropIndex, false);
          if (!tag && checkParent) {
            tag = this.getImageTag(item, type, backdropIndex, true);
            itemId = this.getParentId(item);
            if (!tag || !itemId) {
              return undefined;
            }
          } else if (!tag) {
            return undefined;
          }
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

      const scaling = window.devicePixelRatio;
      if (limitByWidth && maxWidth) {
        params.maxWidth = Math.round(maxWidth * scaling).toString();
      } else if (maxHeight) {
        params.maxHeight = Math.round(maxHeight * scaling).toString();
      }

      url.search = stringify(params);

      return url.toString();
    }
  }
});

export default imageHelper;
