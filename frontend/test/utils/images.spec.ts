import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  type BaseItemDto,
  BaseItemKind,
  type BaseItemPerson,
  ImageType
} from '@jellyfin/sdk/lib/generated-client';
import {
  getImageInfo
} from '#/utils/images';
import { CardShapes } from '#/utils/items'; // Adjusted path
import { remote } from '#/plugins/remote';

// Mock the remote SDK calls
vi.mock('#/plugins/remote', () => ({
  remote: {
    sdk: {
      newUserApi: vi.fn().mockReturnValue({
        getItemImageUrlById: vi.fn()
      })
    }
  }
}));

/*
 * Mock utilities from '#/utils/items'
 * We only need to mock getShapeFromItemType if its actual logic interferes
 * or if we want to force specific shapes. For now, we can rely on item.Type for it.
 * vi.mock('../../src/utils/items', () => ({
 *   ...vi.importActual('../../src/utils/items'),
 *   getShapeFromItemType: vi.fn(),
 *   isPerson: vi.fn() // isPerson is simple (item.Type === 'Person'), direct use is fine
 * }));
 */

const mockGetItemImageUrlById = remote.sdk.newUserApi().getItemImageUrlById as import('vitest').Mock;

describe('getImageInfo', () => {
  let baseItemMock: BaseItemDto;
  let personItemMock: BaseItemPerson;

  beforeEach(() => {
    mockGetItemImageUrlById.mockClear();
    // Default mock implementation for getItemImageUrlById
    mockGetItemImageUrlById.mockImplementation(
      (itemId, imgType, options) => {
        if (!itemId || !imgType) { return; }

        let url = `mockUrl_itemId=${itemId}_imgType=${imgType}`;

        if (options?.maxWidth) { url += `_maxWidth=${options.maxWidth}`; }

        if (options?.maxHeight) { url += `_maxHeight=${options.maxHeight}`; }

        if (options?.quality) { url += `_quality=${options.quality}`; }

        if (options?.format) { url += `_format=${options.format}`; }

        /*
         * The getItemImageUrlById in the SDK takes tag in its options,
         * but getImageInfo itself resolves the tag and passes the imgType.
         * The mock should reflect how getImageUrlWithSize (called by getImageInfo) uses it.
         * If the actual API call for getItemImageUrlById uses a top-level tag parameter, this mock might need adjustment
         * For now, assuming options.tag is not directly passed by getImageUrlWithSize to getItemImageUrlById's top level args.
         */
        return url;
      }
    );

    baseItemMock = {
      Id: 'itemId123',
      Name: 'Test Item',
      Type: BaseItemKind.Movie,
      ImageTags: {},
      ImageBlurHashes: {},
      BackdropImageTags: [],
      PrimaryImageAspectRatio: undefined,
      SeriesId: undefined,
      SeriesPrimaryImageTag: undefined,
      SeriesThumbImageTag: undefined,
      ParentLogoImageTag: undefined,
      ParentLogoItemId: undefined,
      ParentBackdropImageTags: undefined,
      ParentBackdropItemId: undefined,
      ParentThumbImageTag: undefined,
      ParentThumbItemId: undefined,
      ParentPrimaryImageTag: undefined,
      ParentPrimaryImageItemId: undefined,
      AlbumId: undefined,
      AlbumPrimaryImageTag: undefined,
      MediaType: undefined,
      ChildCount: undefined
    };

    personItemMock = {
      Id: 'personId456',
      Name: 'Test Person',
      Type: 'Person', // Used by isPerson utility
      PrimaryImageTag: undefined,
      ImageBlurHashes: {},
      Role: undefined,
      ImageTags: undefined
    };
  });

  it('should return undefined url and blurhash if item has no Id and no parent Id is found', () => {
    const itemWithoutId: BaseItemDto = { ...baseItemMock, Id: undefined };
    const result = getImageInfo(itemWithoutId);

    expect(result.url).toBeUndefined();
    expect(result.blurhash).toBeUndefined();
  });

  describe('for BaseItemPerson', () => {
    it('should use PrimaryImageTag if available', () => {
      personItemMock.PrimaryImageTag = 'personPrimaryTag';
      personItemMock.ImageBlurHashes = {
        [ImageType.Primary]: { personPrimaryTag: 'personBlurhash' }
      };

      const result = getImageInfo(personItemMock);

      expect(result.url).toContain('mockUrl_itemId=personId456_imgType=Primary');
      expect(result.blurhash).toBe('personBlurhash');
    });

    it('should return undefined if no PrimaryImageTag', () => {
      personItemMock.PrimaryImageTag = undefined;

      const result = getImageInfo(personItemMock);

      expect(result.url).toBeUndefined();
      expect(result.blurhash).toBeUndefined();
    });
  });

  describe('with "tag" option', () => {
    it('should use the provided tag with ImageType.Primary by default', () => {
      baseItemMock.ImageBlurHashes = { [ImageType.Primary]: { specificTag123: 'blur1' } };

      const result = getImageInfo(baseItemMock, { tag: 'specificTag123' });

      expect(result.url).toContain('mockUrl_itemId=itemId123_imgType=Primary');
      expect(result.blurhash).toBe('blur1');
    });

    it('should use tag with ImageType.Backdrop if preferBackdrop is true', () => {
      baseItemMock.ImageBlurHashes = { [ImageType.Backdrop]: { specificTag123: 'blurB' } };

      const result = getImageInfo(baseItemMock, { tag: 'specificTag123', preferBackdrop: true });

      expect(result.url).toContain('mockUrl_itemId=itemId123_imgType=Backdrop');
      expect(result.blurhash).toBe('blurB');
    });

    it('should use tag with ImageType.Banner if preferBanner is true', () => {
      baseItemMock.ImageBlurHashes = { [ImageType.Banner]: { bannerTag: 'blurBanner' } };

      const result = getImageInfo(baseItemMock, { tag: 'bannerTag', preferBanner: true });

      expect(result.url).toContain('mockUrl_itemId=itemId123_imgType=Banner');
      expect(result.blurhash).toBe('blurBanner');
    });

    it('should use tag with ImageType.Logo if preferLogo is true', () => {
      baseItemMock.ImageBlurHashes = { [ImageType.Logo]: { logoTag: 'blurLogo' } };

      const result = getImageInfo(baseItemMock, { tag: 'logoTag', preferLogo: true });

      expect(result.url).toContain('mockUrl_itemId=itemId123_imgType=Logo');
      expect(result.blurhash).toBe('blurLogo');
    });

    it('should use tag with ImageType.Thumb if preferThumb is true', () => {
      baseItemMock.ImageBlurHashes = { [ImageType.Thumb]: { thumbTag: 'blurThumb' } };

      const result = getImageInfo(baseItemMock, { tag: 'thumbTag', preferThumb: true });

      expect(result.url).toContain('mockUrl_itemId=itemId123_imgType=Thumb');
      expect(result.blurhash).toBe('blurThumb');
    });
  });

  describe('Image Type Preferences and Fallbacks for BaseItemDto', () => {
    it('should use Thumb if preferThumb and item.ImageTags.Thumb exists', () => {
      baseItemMock.ImageTags = { [ImageType.Thumb]: 'thumbTag1' };
      baseItemMock.ImageBlurHashes = { [ImageType.Thumb]: { thumbTag1: 'blurT' } };

      const result = getImageInfo(baseItemMock, { preferThumb: true });

      expect(result.url).toContain('mockUrl_itemId=itemId123_imgType=Thumb');
      expect(result.blurhash).toBe('blurT');
    });

    it('should use Banner if preferBanner and item.ImageTags.Banner exists', () => {
      baseItemMock.ImageTags = { [ImageType.Banner]: 'bannerTag1' };
      baseItemMock.ImageBlurHashes = { [ImageType.Banner]: { bannerTag1: 'blurB' } };

      const result = getImageInfo(baseItemMock, { preferBanner: true });

      expect(result.url).toContain('mockUrl_itemId=itemId123_imgType=Banner');
      expect(result.blurhash).toBe('blurB');
    });

    it('should use Banner if shape is Banner and item.ImageTags.Banner exists', () => {
      baseItemMock.ImageTags = { [ImageType.Banner]: 'bannerTagShape' };
      baseItemMock.ImageBlurHashes = { [ImageType.Banner]: { bannerTagShape: 'blurBShape' } };

      /*
       * To ensure shape is Banner, we can either mock getShapeFromItemType or set item.Type
       * to something that results in CardShapes.Banner, or directly pass the shape option.
       * Forcing shape option for clarity:
       */
      const result = getImageInfo(baseItemMock, { shape: CardShapes.Banner });

      expect(result.url).toContain('mockUrl_itemId=itemId123_imgType=Banner');
      expect(result.blurhash).toBe('blurBShape');
    });

    it('should use Logo if preferLogo and item.ImageTags.Logo exists', () => {
      baseItemMock.ImageTags = { [ImageType.Logo]: 'logoTag1' };
      baseItemMock.ImageBlurHashes = { [ImageType.Logo]: { logoTag1: 'blurL' } };

      const result = getImageInfo(baseItemMock, { preferLogo: true });

      expect(result.url).toContain('mockUrl_itemId=itemId123_imgType=Logo');
      expect(result.blurhash).toBe('blurL');
    });

    it('should use Backdrop if preferBackdrop and item.BackdropImageTags exists', () => {
      baseItemMock.BackdropImageTags = ['backdropTag1'];
      baseItemMock.ImageBlurHashes = { [ImageType.Backdrop]: { backdropTag1: 'blurBD' } };

      const result = getImageInfo(baseItemMock, { preferBackdrop: true });

      expect(result.url).toContain('mockUrl_itemId=itemId123_imgType=Backdrop');
      expect(result.blurhash).toBe('blurBD');
    });

    it('should use ParentLogo if preferLogo and item has no Logo but ParentLogo exists', () => {
      baseItemMock.ParentLogoImageTag = 'parentLogoTag';
      baseItemMock.ParentLogoItemId = 'parentLogoId';
      baseItemMock.ImageBlurHashes = { [ImageType.Logo]: { parentLogoTag: 'blurParentL' } };

      const result = getImageInfo(baseItemMock, { preferLogo: true });

      expect(result.url).toContain('mockUrl_itemId=parentLogoId_imgType=Logo');
      expect(result.blurhash).toBe('blurParentL');
    });

    it('should use ParentBackdrop if preferBackdrop and item has no Backdrop but ParentBackdrop exists', () => {
      baseItemMock.ParentBackdropImageTags = ['parentBackdropTag'];
      baseItemMock.ParentBackdropItemId = 'parentBackdropId';
      baseItemMock.ImageBlurHashes = { [ImageType.Backdrop]: { parentBackdropTag: 'blurParentBD' } };

      const result = getImageInfo(baseItemMock, { preferBackdrop: true });

      expect(result.url).toContain('mockUrl_itemId=parentBackdropId_imgType=Backdrop');
      expect(result.blurhash).toBe('blurParentBD');
    });

    it('should use SeriesThumb if preferThumb, inheritThumb, and SeriesThumbImageTag exists', () => {
      baseItemMock.SeriesThumbImageTag = 'seriesThumbTag';
      baseItemMock.SeriesId = 'seriesId1';
      baseItemMock.ImageBlurHashes = { [ImageType.Thumb]: { seriesThumbTag: 'blurSeriesT' } };

      const result = getImageInfo(baseItemMock, { preferThumb: true, inheritThumb: true });

      expect(result.url).toContain('mockUrl_itemId=seriesId1_imgType=Thumb');
      expect(result.blurhash).toBe('blurSeriesT');
    });

    it('should not use SeriesThumb if inheritThumb is false', () => {
      baseItemMock.SeriesThumbImageTag = 'seriesThumbTag';
      baseItemMock.SeriesId = 'seriesId1';
      baseItemMock.ImageTags = { [ImageType.Primary]: 'primaryTag' };
      baseItemMock.ImageBlurHashes = { [ImageType.Primary]: { primaryTag: 'blurP' } };

      const result = getImageInfo(baseItemMock, { preferThumb: true, inheritThumb: false });

      expect(result.url).not.toContain('itemId=seriesId1');
      // It should fallback to other images based on priority, e.g. Primary if available
      expect(result.url).toContain('mockUrl_itemId=itemId123_imgType=Primary');
    });

    it('should use ParentThumb if preferThumb, inheritThumb, ParentThumbItemId exists, and MediaType is not Photo', () => {
      baseItemMock.ParentThumbImageTag = 'parentThumbTag';
      baseItemMock.ParentThumbItemId = 'parentThumbId';
      baseItemMock.MediaType = 'Video';
      baseItemMock.ImageBlurHashes = { [ImageType.Thumb]: { parentThumbTag: 'blurParentT' } };

      const result = getImageInfo(baseItemMock, { preferThumb: true, inheritThumb: true });

      expect(result.url).toContain('mockUrl_itemId=parentThumbId_imgType=Thumb');
      expect(result.blurhash).toBe('blurParentT');
    });

    it('should not use ParentThumb if MediaType is Photo', () => {
      baseItemMock.ParentThumbImageTag = 'parentThumbTag';
      baseItemMock.ParentThumbItemId = 'parentThumbId';
      baseItemMock.MediaType = 'Photo';
      baseItemMock.ImageTags = { [ImageType.Primary]: 'primaryTag' };
      baseItemMock.ImageBlurHashes = { [ImageType.Primary]: { primaryTag: 'blurP' } };

      const result = getImageInfo(baseItemMock, { preferThumb: true, inheritThumb: true });

      expect(result.url).not.toContain('itemId=parentThumbId');
      expect(result.url).toContain('mockUrl_itemId=itemId123_imgType=Primary');
    });

    it('should use item Backdrop as Thumb fallback if preferThumb and BackdropImageTags exist and item has no direct Thumb', () => {
      baseItemMock.BackdropImageTags = ['backdropForThumb'];
      baseItemMock.ImageBlurHashes = { [ImageType.Backdrop]: { backdropForThumb: 'blurBackAsThumb' } };
      // Ensure no direct thumb or higher priority parent thumb for this specific test condition
      baseItemMock.ImageTags!.Thumb = undefined;
      baseItemMock.SeriesThumbImageTag = undefined;
      baseItemMock.ParentThumbImageTag = undefined;

      const result = getImageInfo(baseItemMock, { preferThumb: true });

      expect(result.url).toContain('mockUrl_itemId=itemId123_imgType=Backdrop');
      expect(result.blurhash).toBe('blurBackAsThumb');
    });

    it('should use Parent Backdrop as Thumb fallback for Episode if preferThumb, inheritThumb and ParentBackdropImageTags exist', () => {
      baseItemMock.Type = BaseItemKind.Episode;
      baseItemMock.ParentBackdropImageTags = ['parentBackdropForThumb'];
      baseItemMock.ParentBackdropItemId = 'parentBackdropId';
      baseItemMock.ImageBlurHashes = { [ImageType.Backdrop]: { parentBackdropForThumb: 'blurParentBackAsThumb' } };
      // Ensure no higher priority thumbs
      baseItemMock.ImageTags!.Thumb = undefined;
      baseItemMock.SeriesThumbImageTag = undefined;
      baseItemMock.ParentThumbImageTag = undefined;
      baseItemMock.BackdropImageTags = [];

      const result = getImageInfo(baseItemMock, { preferThumb: true, inheritThumb: true });

      expect(result.url).toContain('mockUrl_itemId=parentBackdropId_imgType=Backdrop');
      expect(result.blurhash).toBe('blurParentBackAsThumb');
    });

    it('should use Primary image if item.ImageTags.Primary exists and not an Episode or has children', () => {
      baseItemMock.ImageTags = { [ImageType.Primary]: 'primaryTag1' };
      baseItemMock.ImageBlurHashes = { [ImageType.Primary]: { primaryTag1: 'blurP1' } };
      baseItemMock.Type = BaseItemKind.Movie;

      const result = getImageInfo(baseItemMock);

      expect(result.url).toContain('mockUrl_itemId=itemId123_imgType=Primary');
      expect(result.blurhash).toBe('blurP1');

      baseItemMock.Type = BaseItemKind.Episode;
      baseItemMock.ChildCount = 1;

      const result2 = getImageInfo(baseItemMock);

      expect(result2.url).toContain('mockUrl_itemId=itemId123_imgType=Primary');
      expect(result2.blurhash).toBe('blurP1');
    });

    it('should not use Primary image if item is an Episode with no children, falling back', () => {
      baseItemMock.ImageTags = { [ImageType.Primary]: 'primaryTagEpisode' };
      baseItemMock.Type = BaseItemKind.Episode;
      baseItemMock.ChildCount = 0;
      baseItemMock.BackdropImageTags = ['fallbackBackdrop']; // Fallback
      baseItemMock.ImageBlurHashes = {
        [ImageType.Primary]: { primaryTagEpisode: 'blurPrimEp' },
        [ImageType.Backdrop]: { fallbackBackdrop: 'blurFallback' }
      };

      const result = getImageInfo(baseItemMock);

      expect(result.url).not.toContain('imgType=Primary');
      expect(result.url).toContain('mockUrl_itemId=itemId123_imgType=Backdrop');
      expect(result.blurhash).toBe('blurFallback');
    });

    it('should use SeriesPrimaryImageTag if no direct Primary', () => {
      baseItemMock.SeriesPrimaryImageTag = 'seriesPrimaryTag';
      baseItemMock.SeriesId = 'seriesIdForPrimary';
      baseItemMock.ImageBlurHashes = { [ImageType.Primary]: { seriesPrimaryTag: 'blurSeriesP' } };

      const result = getImageInfo(baseItemMock);

      expect(result.url).toContain('mockUrl_itemId=seriesIdForPrimary_imgType=Primary');
      expect(result.blurhash).toBe('blurSeriesP');
    });

    it('should use ParentPrimaryImageTag if no direct or series Primary', () => {
      baseItemMock.ParentPrimaryImageTag = 'parentPrimaryTag';
      baseItemMock.ParentPrimaryImageItemId = 'parentIdForPrimary';
      baseItemMock.ImageBlurHashes = { [ImageType.Primary]: { parentPrimaryTag: 'blurParentP' } };

      const result = getImageInfo(baseItemMock);

      expect(result.url).toContain('mockUrl_itemId=parentIdForPrimary_imgType=Primary');
      expect(result.blurhash).toBe('blurParentP');
    });

    it('should use AlbumPrimaryImageTag if item has AlbumId and AlbumPrimaryImageTag', () => {
      baseItemMock.AlbumPrimaryImageTag = 'albumPrimaryTag';
      baseItemMock.AlbumId = 'albumIdForPrimary';
      baseItemMock.ImageBlurHashes = { [ImageType.Primary]: { albumPrimaryTag: 'blurAlbumP' } };

      const result = getImageInfo(baseItemMock);

      expect(result.url).toContain('mockUrl_itemId=albumIdForPrimary_imgType=Primary');
      expect(result.blurhash).toBe('blurAlbumP');
    });

    it('should use Thumb for Season type if ImageTags.Thumb exists (and no higher priority like Primary)', () => {
      baseItemMock.Type = BaseItemKind.Season;
      baseItemMock.ImageTags = { [ImageType.Thumb]: 'seasonThumbTag' };
      baseItemMock.ImageBlurHashes = { [ImageType.Thumb]: { seasonThumbTag: 'blurSeasonThumb' } };
      // Ensure no primary, as primary is checked before this specific season logic in the code
      baseItemMock.ImageTags.Primary = undefined;
      baseItemMock.SeriesPrimaryImageTag = undefined;
      baseItemMock.ParentPrimaryImageTag = undefined;
      baseItemMock.AlbumPrimaryImageTag = undefined;

      const result = getImageInfo(baseItemMock);

      expect(result.url).toContain('mockUrl_itemId=itemId123_imgType=Thumb');
      expect(result.blurhash).toBe('blurSeasonThumb');
    });

    it('should fallback to item BackdropImageTags if other preferred images are not found', () => {
      baseItemMock.BackdropImageTags = ['fallbackBackdrop1'];
      baseItemMock.ImageBlurHashes = { [ImageType.Backdrop]: { fallbackBackdrop1: 'blurFB1' } };

      const result = getImageInfo(baseItemMock);

      expect(result.url).toContain('mockUrl_itemId=itemId123_imgType=Backdrop');
      expect(result.blurhash).toBe('blurFB1');
    });

    it('should fallback to item ImageTags.Thumb if Backdrop is also not found', () => {
      baseItemMock.ImageTags = { [ImageType.Thumb]: 'fallbackThumb1' };
      baseItemMock.ImageBlurHashes = { [ImageType.Thumb]: { fallbackThumb1: 'blurFT1' } };

      const result = getImageInfo(baseItemMock);

      expect(result.url).toContain('mockUrl_itemId=itemId123_imgType=Thumb');
      expect(result.blurhash).toBe('blurFT1');
    });

    it('should fallback to SeriesThumbImageTag if other direct images not found and inheritThumb is true', () => {
      baseItemMock.SeriesThumbImageTag = 'fallbackSeriesThumb';
      baseItemMock.SeriesId = 'fallbackSeriesId';
      baseItemMock.ImageBlurHashes = { [ImageType.Thumb]: { fallbackSeriesThumb: 'blurFST' } };

      const result = getImageInfo(baseItemMock, { inheritThumb: true });

      expect(result.url).toContain('mockUrl_itemId=fallbackSeriesId_imgType=Thumb');
      expect(result.blurhash).toBe('blurFST');
    });

    it('should fallback to ParentThumbImageTag if other direct/series images not found and inheritThumb is true', () => {
      baseItemMock.ParentThumbImageTag = 'fallbackParentThumb';
      baseItemMock.ParentThumbItemId = 'fallbackParentThumbId';
      baseItemMock.ImageBlurHashes = { [ImageType.Thumb]: { fallbackParentThumb: 'blurFPT' } };

      const result = getImageInfo(baseItemMock, { inheritThumb: true });

      expect(result.url).toContain('mockUrl_itemId=fallbackParentThumbId_imgType=Thumb');
      expect(result.blurhash).toBe('blurFPT');
    });

    it('should fallback to ParentBackdropImageTags if all else fails and inheritThumb is true', () => {
      baseItemMock.ParentBackdropImageTags = ['finalFallbackBackdrop'];
      baseItemMock.ParentBackdropItemId = 'finalFallbackParentId';
      baseItemMock.ImageBlurHashes = { [ImageType.Backdrop]: { finalFallbackBackdrop: 'blurFFB' } };

      const result = getImageInfo(baseItemMock, { inheritThumb: true });

      expect(result.url).toContain('mockUrl_itemId=finalFallbackParentId_imgType=Backdrop');
      expect(result.blurhash).toBe('blurFFB');
    });

    it('should return undefined url and blurhash if no image is found after all fallbacks', () => {
      const emptyItem: BaseItemDto = { Id: 'emptyId', Type: BaseItemKind.Unknown, Name: 'empty' };
      const result = getImageInfo(emptyItem);

      expect(result.url).toBeUndefined();
      expect(result.blurhash).toBeUndefined();
    });
  });

  describe('Image Sizing and Quality Options', () => {
    it('should pass width, quality, and ratio to getImageUrlWithSize (mocked by getItemImageUrlById)', () => {
      baseItemMock.ImageTags = { [ImageType.Primary]: 'sizingTag' };
      getImageInfo(baseItemMock, { width: 200, quality: 80, ratio: 1.5 });
      expect(mockGetItemImageUrlById).toHaveBeenCalledWith(
        'itemId123',
        ImageType.Primary,
        expect.objectContaining({
          maxWidth: 300, // 200 * 1.5
          maxHeight: undefined, // Height not specified directly for this call unless PrimaryImageAspectRatio
          quality: 80,
          format: 'Webp'
        })
      );
    });

    it('should calculate height for Primary images if width and PrimaryImageAspectRatio are provided', () => {
      baseItemMock.ImageTags = { [ImageType.Primary]: 'primaryAspectTag' };
      baseItemMock.PrimaryImageAspectRatio = 2; // width / height = 2  => height = width / 2
      baseItemMock.ImageBlurHashes = { [ImageType.Primary]: { primaryAspectTag: 'blurAspect' } };

      getImageInfo(baseItemMock, { width: 200 });
      expect(mockGetItemImageUrlById).toHaveBeenCalledWith(
        'itemId123',
        ImageType.Primary,
        expect.objectContaining({
          maxWidth: 200,
          maxHeight: 100 // 200 / 2
        })
      );
    });

    it('should calculate height for Album Primary images if width and PrimaryImageAspectRatio are provided', () => {
      baseItemMock.AlbumPrimaryImageTag = 'albumAspectTag';
      baseItemMock.AlbumId = 'albumId123';
      baseItemMock.PrimaryImageAspectRatio = 1.5; // width / height = 1.5 => height = width / 1.5
      baseItemMock.ImageBlurHashes = { [ImageType.Primary]: { albumAspectTag: 'blurAlbumAspect' } };
      // Clear other primary sources to ensure AlbumPrimary is chosen
      baseItemMock.ImageTags!.Primary = undefined;
      baseItemMock.SeriesPrimaryImageTag = undefined;
      baseItemMock.ParentPrimaryImageTag = undefined;

      getImageInfo(baseItemMock, { width: 300 });
      expect(mockGetItemImageUrlById).toHaveBeenCalledWith(
        'albumId123', // Item ID should be AlbumId
        ImageType.Primary,
        expect.objectContaining({
          maxWidth: 300,
          maxHeight: 200 // 300 / 1.5
        })
      );
    });

    it('should not calculate height if width is not provided, even if PrimaryImageAspectRatio is', () => {
      baseItemMock.ImageTags = { [ImageType.Primary]: 'primaryAspectTagNoWidth' };
      baseItemMock.PrimaryImageAspectRatio = 2;
      getImageInfo(baseItemMock, {}); // No width
      expect(mockGetItemImageUrlById).toHaveBeenCalledWith(
        'itemId123',
        ImageType.Primary,
        expect.objectContaining({
          maxWidth: undefined,
          maxHeight: undefined // Undefined because width is undefined
        })
      );
    });
  });

  describe('Blurhash Retrieval', () => {
    it('should retrieve blurhash if imgType, imgTag, and blurhash entry exist', () => {
      baseItemMock.ImageTags = { [ImageType.Primary]: 'blurTag' };
      baseItemMock.ImageBlurHashes = { [ImageType.Primary]: { blurTag: 'actualBlurhashValue' } };

      const result = getImageInfo(baseItemMock);

      expect(result.blurhash).toBe('actualBlurhashValue');
    });

    it('should return undefined blurhash if imgType or imgTag is undefined (no image found)', () => {
      const result = getImageInfo({ Id: 'someId', Type: BaseItemKind.Unknown, Name: 'test' }); // No image tags

      expect(result.blurhash).toBeUndefined();
    });

    it('should return undefined blurhash if ImageBlurHashes does not have an entry for the type/tag', () => {
      baseItemMock.ImageTags = { [ImageType.Primary]: 'noBlurTag' };
      baseItemMock.ImageBlurHashes = { [ImageType.Primary]: { /* noBlurTag missing */ } };

      const result = getImageInfo(baseItemMock);

      expect(result.blurhash).toBeUndefined();

      baseItemMock.ImageBlurHashes = {};

      const result2 = getImageInfo(baseItemMock);

      expect(result2.blurhash).toBeUndefined();
    });
  });
});
