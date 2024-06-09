/**
 * Helper for image manipulation and image-related utility functions
 *
 */
import {
  type BaseItemDto,
  BaseItemKind,
  type BaseItemPerson,
  ImageType
} from '@jellyfin/sdk/lib/generated-client';
import { remote } from '@/plugins/remote';
import { CardShapes, getShapeFromItemType, isPerson } from '@/utils/items';

export interface ImageUrlInfo {
  url?: string;
  blurhash?: string;
}

const excludedBlurhashTypes = Object.freeze(
  new Set<ImageType>([ImageType.Logo])
);

/**
 * Gets the tag of the image of an specific item and type.
 *
 * @param item - The item object.
 * @param type - The type of the image requested.
 * @param [index=0] - Index of the Backdrop image (when ImageType equals to 'Backdrop').
 * @param [checkParent=true] - Looks for tag/image type for the parent if the passed item doesn't have the ImageType requested
 * @returns Returns the tag, undefined if the specific ImageType doesn't exist.
 */
export function getImageTag(
  item: BaseItemDto | BaseItemPerson,
  type: ImageType,
  index = 0,
  checkParent = true
): string | undefined {
  if (isPerson(item)) {
    return item.PrimaryImageTag && type === ImageType.Primary
      ? item.PrimaryImageTag
      : undefined;
  }

  if (item.ImageTags?.[type]) {
    return item.ImageTags[type];
  } else if (type === ImageType.Backdrop && item.BackdropImageTags?.[index]) {
    return item.BackdropImageTags[index];
  }

  if (checkParent) {
    switch (type) {
      case ImageType.Primary: {
        return (
          item.AlbumPrimaryImageTag
          || item.ChannelPrimaryImageTag
          || item.ParentPrimaryImageTag
          || undefined
        );
      }
      case ImageType.Art: {
        return item.ParentArtImageTag ?? undefined;
      }
      case ImageType.Backdrop: {
        return item.ParentBackdropImageTags?.[index] ?? undefined;
      }
      case ImageType.Logo: {
        return item.ParentLogoImageTag ?? undefined;
      }
      case ImageType.Thumb: {
        return item.ParentThumbImageTag ?? undefined;
      }
    }
  }
}

/**
 * Gets the itemId of the parent element.
 *
 * @param item - The item object.
 * @returns Returns the parent itemId, undefined if it doesn't exist.
 */
export function getParentId(item: BaseItemDto): string | undefined {
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
}

/**
 * Gets the blurhash string of an image given the item and the image type desired.
 *
 * @param item - The item object.
 * @param type - The type of the image requested.
 * @param [index=0] - Index of the Backdrop image (when ImageType equals to 'Backdrop').
 * @param [checkParent=true] - Checks for the parent's images blurhash (in case the provided item doesn't have it)
 * @returns Returns the tag, undefined if the specific ImageType doesn't exist.
 */
export function getBlurhash(
  item: BaseItemDto | BaseItemPerson,
  type: ImageType,
  index = 0,
  checkParent = true
): string | undefined {
  if (item) {
    const tag = getImageTag(item, type, index, checkParent);

    if (
      tag
      && !excludedBlurhashTypes.has(type)
      && item.ImageBlurHashes?.[type]?.[tag]
    ) {
      return item.ImageBlurHashes[type]?.[tag];
    }
  }
}

/**
 * Gets the desired aspect ratio based on card shape
 * @param shape
 * @returns
 */
export function getDesiredAspect(shape: CardShapes): number {
  let aspectRatio;

  switch (shape) {
    case CardShapes.Portrait: {
      aspectRatio = 2 / 3;
      break;
    }
    case CardShapes.Thumb: {
      aspectRatio = 16 / 9;
      break;
    }
    case CardShapes.Banner: {
      aspectRatio = 1000 / 185;
      break;
    }
    default: {
      aspectRatio = 1;
      break;
    }
  }

  return aspectRatio;
}

/**
 * Generates the image information for a BaseItemDto or a BasePersonDto according to set priorities.
 *
 * @param item - Item to get image information for
 * @param [options] - Optional parameters for the function.
 * @param [options.shape] - Shape of the card or element, used to determine what kind of image to prefer
 * @param [options.preferThumb=false] - Prefer the Thumb images
 * @param [options.preferBanner=false] - Prefer the Banner images
 * @param [options.preferLogo=false] - Prefer the Logo images
 * @param [options.preferBackdrop=false] - Prefer the Backdrop images
 * @param [options.inheritThumb=false] - Inherit the thumb from parent items
 * @param [options.quality=90] - Sets the quality of the returned image
 * @param [options.width] - Sets the requested width of the image
 * @param [options.ratio=1] - Sets the device pixel ratio for the image, used for computing the real image size
 * @param [options.tag] - Sets a specific image tag to get, bypassing the automatic priorities.
 * @returns Information for the item, containing the full URL and blurhash.
 */
export function getImageInfo(
  item: BaseItemDto | BaseItemPerson,
  {
    shape = isPerson(item)
      ? CardShapes.Portrait
      : getShapeFromItemType(item.Type),
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
  // TODO: Refactor to have separate getPosterImageInfo, getThumbImageInfo and getBackdropImageInfo.
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
  } else if (preferThumb && item.ImageTags?.Thumb) {
    imgType = ImageType.Thumb;
    imgTag = item.ImageTags.Thumb;
  } else if (
    (preferBanner || shape === CardShapes.Banner)
    && item.ImageTags?.Banner
  ) {
    imgType = ImageType.Banner;
    imgTag = item.ImageTags.Banner;
  } else if (preferLogo && item.ImageTags?.Logo) {
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
    preferBackdrop
    && item.ParentBackdropImageTags?.[0]
    && item.ParentBackdropItemId
  ) {
    imgType = ImageType.Backdrop;
    imgTag = item.ParentBackdropImageTags[0];
    itemId = item.ParentBackdropItemId;
  } else if (preferThumb && item.SeriesThumbImageTag && inheritThumb) {
    imgType = ImageType.Thumb;
    imgTag = item.SeriesThumbImageTag;
    itemId = item.SeriesId;
  } else if (
    preferThumb
    && item.ParentThumbItemId
    && inheritThumb
    && item.MediaType !== 'Photo'
  ) {
    imgType = ImageType.Thumb;
    imgTag = item.ParentThumbImageTag;
    itemId = item.ParentThumbItemId;
  } else if (
    preferThumb
    && item.BackdropImageTags?.length
  ) {
    imgType = ImageType.Backdrop;
    imgTag = item.BackdropImageTags[0];
  } else if (
    preferThumb
    && item.ParentBackdropImageTags?.length
    && inheritThumb
    && item.Type === BaseItemKind.Episode
  ) {
    imgType = ImageType.Backdrop;
    imgTag = item.ParentBackdropImageTags[0];
    itemId = item.ParentBackdropItemId;
  } else if (item.ImageTags?.Primary && (item.Type !== BaseItemKind.Episode || item.ChildCount !== 0)) {
    imgType = ImageType.Primary;
    imgTag = item.ImageTags.Primary;
    height
      = width && item.PrimaryImageAspectRatio
        ? Math.round(width / item.PrimaryImageAspectRatio)
        : undefined;
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
    height
      = width && item.PrimaryImageAspectRatio
        ? Math.round(width / item.PrimaryImageAspectRatio)
        : undefined;
  } else if (
    item.Type === BaseItemKind.Season
    && item.ImageTags?.Thumb
  ) {
    imgType = ImageType.Thumb;
    imgTag = item.ImageTags.Thumb;
  } else if (item.BackdropImageTags?.length) {
    imgType = ImageType.Backdrop;
    imgTag = item.BackdropImageTags[0];
  } else if (item.ImageTags?.Thumb) {
    imgType = ImageType.Thumb;
    imgTag = item.ImageTags.Thumb;
  } else if (item.SeriesThumbImageTag && inheritThumb) {
    imgType = ImageType.Thumb;
    imgTag = item.SeriesThumbImageTag;
    itemId = item.SeriesId;
  } else if (item.ParentThumbItemId && inheritThumb) {
    imgType = ImageType.Thumb;
    imgTag = item.ParentThumbImageTag;
    itemId = item.ParentThumbItemId;
  } else if (
    item.ParentBackdropImageTags?.length
    && inheritThumb
  ) {
    imgType = ImageType.Backdrop;
    imgTag = item.ParentBackdropImageTags[0];
    itemId = item.ParentBackdropItemId;
  }

  if (!itemId && item.Id) {
    itemId = item.Id;
  }

  if (!itemId) {
    return {
      url: undefined,
      blurhash: undefined
    };
  }

  const url_string = remote.sdk.api?.getItemImageUrl(itemId, imgType);

  if (imgTag && imgType && url_string) {
    url = new URL(url_string);

    const parameters: Record<string, string> = {
      imgTag,
      quality: quality.toString()
    };

    if (width) {
      width = Math.round(width * ratio);
      parameters.maxWidth = width.toString();
    }

    if (height) {
      height = Math.round(height * ratio);
      parameters.maxHeight = height.toString();
    }

    url.search = new URLSearchParams(parameters).toString();
  }

  return {
    url: url?.href,
    blurhash:
      imgType && imgTag ? item.ImageBlurHashes?.[imgType]?.[imgTag] : undefined
  };
}

/**
 * Generates the logo information for a BaseItemDto or a BasePersonDto according to set priorities.
 *
 * @param item - Item to get image information for
 * @param [options] - Optional parameters for the function.
 * @param [options.quality=90] - Sets the quality of the returned image
 * @param [options.width] - Sets the requested width of the image
 * @param [options.ratio=1] - Sets the device pixel ratio for the image, used for computing the real image size
 * @param [options.tag] - Sets a specific image tag to get, bypassing the automatic priorities.
 * @returns Information for the item, containing the full URL, image tag and blurhash.
 */
export function getLogo(
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
  let itemId: string | null | undefined = item.Id;

  if (tag) {
    imgType = ImageType.Logo;
    imgTag = tag;
  } else if (item.ImageTags?.Logo) {
    imgType = ImageType.Logo;
    imgTag = item.ImageTags.Logo;
  } else if (item.ParentLogoImageTag && item.ParentLogoItemId) {
    imgType = ImageType.Logo;
    imgTag = item.ParentLogoImageTag;
    itemId = item.ParentLogoItemId;
  }

  if (imgTag && imgType && itemId) {
    url = new URL(remote.sdk.api?.getItemImageUrl(itemId, imgType) ?? '');

    const parameters: Record<string, string> = {
      imgTag,
      quality: quality.toString()
    };

    if (width) {
      width = Math.round(width * ratio);
      parameters.maxWidth = width.toString();
    }

    url.search = new URLSearchParams(parameters).toString();
  }

  return {
    url: url?.href,
    blurhash:
      imgType && imgTag ? item.ImageBlurHashes?.[imgType]?.[imgTag] : undefined
  };
}
