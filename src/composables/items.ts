import { BaseItemDto, BaseItemPerson, ImageType } from '@jellyfin/client-axios';
import { AxiosInstance } from 'axios';
import { inject } from 'vue';
import { stringify } from 'qs';
import { AxiosSymbol } from '~/plugins/axios';

export interface ImageUrlInfo {
  url: string | undefined;
  tag: string | null | undefined;
  blurhash: string | undefined;
}

export enum CardShapes {
  Portrait = 'portrait-card',
  Thumb = 'thumb-card',
  Square = 'square-card',
  Banner = 'banner-card'
}

export type ValidCardShapes =
  | CardShapes.Portrait
  | CardShapes.Thumb
  | CardShapes.Square
  | CardShapes.Banner;

export const validPersonTypes = [
  'Actor',
  'Director',
  'Composer',
  'Writer',
  'GuestStar',
  'Producer',
  'Conductor',
  'Lyricist'
];

export function useBaseItem() {
  const axios: AxiosInstance = inject(AxiosSymbol) as AxiosInstance;

  /**
   * Gets the card shape associated with a collection type
   *
   * @param {(string | null | undefined)} itemType - type of item
   * @returns {string} CSS class to use as the shape of the card
   */
  function getShapeFromItemType(
    itemType: string | null | undefined
  ): ValidCardShapes {
    // TODO: Refactor to take a BaseItemDto or BaseItemPerson instead
    switch (itemType?.toLowerCase()) {
      case 'audio':
      case 'folder':
      case 'musicalbum':
      case 'musicartist':
      case 'musicgenre':
      case 'photoalbum':
      case 'playlist':
      case 'video':
        return CardShapes.Square;
      case 'episode':
      case 'musicvideo':
      case 'studio':
        return CardShapes.Thumb;
      case 'book':
      case 'boxSet':
      case 'genre':
      case 'movie':
      case 'person':
      case 'series':
      default:
        return CardShapes.Portrait;
    }
  }

  /**
   * Determines if the item is a person
   *
   * @param {*} item - The item to be checked.
   * @returns {boolean} Whether the provided item is of type BaseItemPerson.
   */
  function isPerson(
    item: BaseItemDto | BaseItemPerson
  ): item is BaseItemPerson {
    if (
      'Role' in (item as BaseItemPerson) ||
      (item.Type && validPersonTypes.includes(item.Type))
    ) {
      return true;
    }

    return false;
  }

  /**
   * Generates the image information for a BaseItemDto or a BasePersonDto according to set priorities.
   *
   * @param {(BaseItemDto | BaseItemPerson)} item - Item to get image information for
   * @param {object} [options] - Optional parameters for the function.
   * @param {ValidCardShapes} [options.shape] - Shape of the card or element, used to determine what kind of image to prefer
   * @param {boolean} [options.preferThumb=false] - Prefer the Thumb images
   * @param {boolean} [options.preferBanner=false] - Prefer the Banner images
   * @param {boolean} [options.preferLogo=false] - Prefer the Logo images
   * @param {boolean} [options.preferBackdrop=false] - Prefer the Backdrop images
   * @param {boolean} [options.inheritThumb=false] - Inherit the thumb from parent items
   * @param {number} [options.quality=90] - Sets the quality of the returned image
   * @param {number} [options.width] - Sets the requested width of the image
   * @param {number} [options.ratio=1] - Sets the device pixel ratio for the image, used for computing the real image size
   * @param {string} [options.tag] - Sets a specific image tag to get, bypassing the automatic priorities.
   * @returns {ImageUrlInfo} Information for the item, containing the full URL, image tag and blurhash.
   */
  function getImageInfo(
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
      shape?: ValidCardShapes;
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
      (preferBanner || shape === CardShapes.Banner) &&
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
    } else if (preferLogo && item.ParentLogoImageTag && item.ParentLogoItemId) {
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

    if (imgTag && imgType) {
      url = new URL(
        `${axios.defaults.baseURL}/Items/${itemId}/Images/${imgType}`
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

  /**
   * Generates the image information for a BaseItemDto or a BasePersonDto according to set priorities.
   *
   * @param {(BaseItemDto | BaseItemPerson)} item - Item to get image information for
   * @param {object} [options] - Optional parameters for the function.
   * @param {number} [options.quality=90] - Sets the quality of the returned image
   * @param {number} [options.width] - Sets the requested width of the image
   * @param {number} [options.ratio=1] - Sets the device pixel ratio for the image, used for computing the real image size
   * @param {string} [options.tag] - Sets a specific image tag to get, bypassing the automatic priorities.
   * @returns {ImageUrlInfo} Information for the item, containing the full URL, image tag and blurhash.
   */
  function getLogo(
    item: BaseItemDto,
    {
      quality = 90,
      width,
      ratio = 1,
      tag
    }: {
      quality?: number;
      width?: number;
      ratio?: number;
      tag?: string;
    } = {}
  ): ImageUrlInfo {
    let url;
    let imgType;
    let imgTag;
    let height;
    let itemId: string | null | undefined = item.Id;

    if (tag) {
      imgType = ImageType.Logo;
      imgTag = tag;
    } else if (item.ImageTags && item.ImageTags.Logo) {
      imgType = ImageType.Logo;
      imgTag = item.ImageTags.Logo;
    } else if (item.ParentLogoImageTag && item.ParentLogoItemId) {
      imgType = ImageType.Logo;
      imgTag = item.ParentLogoImageTag;
      itemId = item.ParentLogoItemId;
    }

    if (imgTag && imgType) {
      url = new URL(
        `${axios.defaults.baseURL}/Items/${itemId}/Images/${imgType}`
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

  /**
   * Returns the appropiate material design icon for the BaseItemDto provided
   *
   * @param {BaseItemDto | BaseItemPerson} item - The item we want to get the icon for
   * @returns {string} - The string that references the icon
   */
  function getItemIcon(item: BaseItemDto | BaseItemPerson): string {
    let itemIcon = '';

    if (isPerson(item)) {
      itemIcon = 'mdi-account';
    } else {
      switch (item.Type) {
        case 'Audio':
          itemIcon = 'mdi-music-note';
          break;
        case 'Book':
          itemIcon = 'mdi-book-open-page-variant';
          break;
        case 'BoxSet':
          itemIcon = 'mdi-folder-multiple';
          break;
        case 'Folder':
        case 'CollectionFolder':
          itemIcon = 'mdi-folder';
          break;
        case 'Movie':
          itemIcon = 'mdi-filmstrip';
          break;
        case 'MusicAlbum':
          itemIcon = 'mdi-album';
          break;
        case 'MusicArtist':
        case 'Person':
          itemIcon = 'mdi-account';
          break;
        case 'PhotoAlbum':
          itemIcon = 'mdi-image-multiple';
          break;
        case 'Playlist':
          itemIcon = 'mdi-playlist-play';
          break;
        case 'Series':
        case 'Episode':
          itemIcon = 'mdi-television-classic';
          break;
      }
    }

    return itemIcon;
  }

  return { getImageInfo, getLogo, isPerson, getShapeFromItemType, getItemIcon };
}
