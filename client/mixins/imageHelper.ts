/**
 * Helper for image manipulation and image-related utility functions
 *
 * @mixin
 */
import Vue from 'vue';
import { stringify } from 'qs';
import { BaseItemDto, BaseItemPerson, ImageType } from '@jellyfin/client-axios';
import { getShapeFromItemType, CardShapes, isPerson } from '~/utils/items';

export interface ImageUrlInfo {
  url: string | undefined;
  tag: string | null | undefined;
  blurhash: string | undefined;
}

declare module '@nuxt/types' {
  interface Context {
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
    getImageInfo(
      item: BaseItemDto,
      options?: {
        shape?: CardShapes;
        preferThumb?: boolean;
        preferBanner?: boolean;
        preferLogo?: boolean;
        preferBackdrop?: boolean;
        inheritThumb?: boolean;
        quality?: number;
        width?: number;
        ratio?: number;
        tag?: string;
      }
    ): ImageUrlInfo;
  }

  interface NuxtAppOptions {
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
    getImageInfo(
      item: BaseItemDto,
      options?: {
        shape?: CardShapes;
        preferThumb?: boolean;
        preferBanner?: boolean;
        preferLogo?: boolean;
        preferBackdrop?: boolean;
        inheritThumb?: boolean;
        quality?: number;
        width?: number;
        ratio?: number;
        tag?: string;
      }
    ): ImageUrlInfo;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
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
    getImageInfo(
      item: BaseItemDto,
      options?: {
        shape?: CardShapes;
        preferThumb?: boolean;
        preferBanner?: boolean;
        preferLogo?: boolean;
        preferBackdrop?: boolean;
        inheritThumb?: boolean;
        quality?: number;
        width?: number;
        ratio?: number;
        tag?: string;
      }
    ): ImageUrlInfo;
  }
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
    getDesiredAspect(shape: CardShapes): number {
      let aspectRatio;

      switch (shape) {
        case 'portrait-card':
          aspectRatio = 2 / 3;
          break;
        case 'thumb-card':
          aspectRatio = 16 / 9;
          break;
        case 'banner-card':
          aspectRatio = 1000 / 185;
          break;
        case 'square-card':
        default:
          aspectRatio = 1;
          break;
      }

      return aspectRatio;
    },
    getImageInfo(
      item: BaseItemDto | BaseItemPerson,
      {
        shape = getShapeFromItemType(item.Type),
        preferThumb = false,
        preferBanner = false,
        preferLogo = false,
        preferBackdrop = false,
        inheritThumb = true,
        quality = 90,
        width,
        ratio = 1,
        tag
      }: {
        shape?: CardShapes;
        preferThumb?: boolean;
        preferBanner?: boolean;
        preferLogo?: boolean;
        preferBackdrop?: boolean;
        inheritThumb?: boolean;
        quality?: number;
        width?: number;
        ratio?: number;
        tag?: string;
      } = {}
    ): ImageUrlInfo {
      let url;
      let imgType;
      let imgTag;
      let itemId: string | null | undefined = item.Id;
      let height;

      if (tag && preferBackdrop) {
        imgType = ImageType.Backdrop;
        imgTag = tag;
      } else if (tag && preferBanner) {
        imgType = ImageType.Banner;
        imgTag = tag;
      } else if (tag && preferLogo) {
        imgType = ImageType.Logo;
        imgTag = tag;
      } else if (tag && preferThumb) {
        imgType = ImageType.Thumb;
        imgTag = tag;
      } else if (tag) {
        imgType = ImageType.Primary;
        imgTag = tag;
      } else if (isPerson(item)) {
        imgType = ImageType.Primary;
        imgTag = item.PrimaryImageTag;
      } else if (preferThumb && item.ImageTags && item.ImageTags.Thumb) {
        imgType = ImageType.Thumb;
        imgTag = item.ImageTags.Thumb;
      } else if (
        (preferBanner || shape === 'banner-card') &&
        item.ImageTags &&
        item.ImageTags.Banner
      ) {
        imgType = ImageType.Banner;
        imgTag = item.ImageTags.Banner;
      } else if (preferLogo && item.ImageTags && item.ImageTags.Logo) {
        imgType = ImageType.Logo;
        imgTag = item.ImageTags.Logo;
      } else if (preferBackdrop && item.BackdropImageTags?.[0]) {
        imgType = ImageType.Backdrop;
        imgTag = item.BackdropImageTags[0];
      } else if (
        preferLogo &&
        item.ParentLogoImageTag &&
        item.ParentLogoItemId
      ) {
        imgType = ImageType.Logo;
        imgTag = item.ParentLogoImageTag;
        itemId = item.ParentLogoItemId;
      } else if (
        preferBackdrop &&
        item.ParentBackdropImageTags?.[0] &&
        item.ParentBackdropItemId
      ) {
        imgType = ImageType.Backdrop;
        imgTag = item.ParentBackdropImageTags[0];
        itemId = item.ParentBackdropItemId;
      } else if (preferThumb && item.SeriesThumbImageTag && inheritThumb) {
        imgType = ImageType.Thumb;
        imgTag = item.SeriesThumbImageTag;
        itemId = item.SeriesId;
      } else if (
        preferThumb &&
        item.ParentThumbItemId &&
        inheritThumb &&
        item.MediaType !== 'Photo'
      ) {
        imgType = ImageType.Thumb;
        imgTag = item.ParentThumbImageTag;
        itemId = item.ParentThumbItemId;
      } else if (
        preferThumb &&
        item.BackdropImageTags &&
        item.BackdropImageTags.length
      ) {
        imgType = ImageType.Backdrop;
        imgTag = item.BackdropImageTags[0];
      } else if (
        preferThumb &&
        item.ParentBackdropImageTags &&
        item.ParentBackdropImageTags.length &&
        inheritThumb &&
        item.Type === 'Episode'
      ) {
        imgType = ImageType.Backdrop;
        imgTag = item.ParentBackdropImageTags[0];
        itemId = item.ParentBackdropItemId;
      } else if (
        item.ImageTags &&
        item.ImageTags.Primary &&
        (item.Type !== 'Episode' || item.ChildCount !== 0)
      ) {
        imgType = ImageType.Primary;
        imgTag = item.ImageTags.Primary;
        height =
          width && item.PrimaryImageAspectRatio
            ? Math.round(width / item.PrimaryImageAspectRatio)
            : null;
      } else if (item.SeriesPrimaryImageTag) {
        imgType = ImageType.Primary;
        imgTag = item.SeriesPrimaryImageTag;
        itemId = item.SeriesId;
      } else if (item.ParentPrimaryImageTag) {
        imgType = ImageType.Primary;
        imgTag = item.ParentPrimaryImageTag;
        itemId = item.ParentPrimaryImageItemId;
      } else if (item.AlbumId && item.AlbumPrimaryImageTag) {
        imgType = ImageType.Primary;
        imgTag = item.AlbumPrimaryImageTag;
        itemId = item.AlbumId;
        height =
          width && item.PrimaryImageAspectRatio
            ? Math.round(width / item.PrimaryImageAspectRatio)
            : null;
      } else if (
        item.Type === 'Season' &&
        item.ImageTags &&
        item.ImageTags.Thumb
      ) {
        imgType = ImageType.Thumb;
        imgTag = item.ImageTags.Thumb;
      } else if (item.BackdropImageTags && item.BackdropImageTags.length) {
        imgType = ImageType.Backdrop;
        imgTag = item.BackdropImageTags[0];
      } else if (item.ImageTags && item.ImageTags.Thumb) {
        imgType = ImageType.Thumb;
        imgTag = item.ImageTags.Thumb;
      } else if (item.SeriesThumbImageTag && inheritThumb !== false) {
        imgType = ImageType.Thumb;
        imgTag = item.SeriesThumbImageTag;
        itemId = item.SeriesId;
      } else if (item.ParentThumbItemId && inheritThumb !== false) {
        imgType = ImageType.Thumb;
        imgTag = item.ParentThumbImageTag;
        itemId = item.ParentThumbItemId;
      } else if (
        item.ParentBackdropImageTags &&
        item.ParentBackdropImageTags.length &&
        inheritThumb !== false
      ) {
        imgType = ImageType.Backdrop;
        imgTag = item.ParentBackdropImageTags[0];
        itemId = item.ParentBackdropItemId;
      }

      if (!itemId) {
        itemId = item.Id;
      }

      if (imgTag && imgType) {
        url = new URL(
          `${this.$axios.defaults.baseURL}/Items/${itemId}/Images/${imgType}`
        );

        const params: { [k: string]: string | number | undefined } = {
          imgTag,
          quality
        };

        if (width) {
          width = Math.round(width * ratio);
          params.maxWidth = width;
        }

        if (height) {
          height = Math.round(height * ratio);
          params.maxHeight = height;
        }

        url.search = stringify(params);
      }

      return {
        url: url?.href,
        tag: imgTag,
        blurhash:
          imgType && imgTag ? item.ImageBlurHashes?.[imgType]?.[imgTag] : ''
      };
    }
  }
});

export default imageHelper;
