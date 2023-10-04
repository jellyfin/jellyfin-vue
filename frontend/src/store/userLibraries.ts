import { computed, watch } from 'vue';
import { RemovableRef, useStorage } from '@vueuse/core';
import { getUserViewsApi } from '@jellyfin/sdk/lib/utils/api/user-views-api';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/tv-shows-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import {
  BaseItemDto,
  ImageType,
  ItemFields
} from '@jellyfin/sdk/lib/generated-client';
import { CardShapes } from '@/utils/items';
import { usei18n, useRemote, useSnackbar } from '@/composables';
import { mergeExcludingUnknown } from '@/utils/data-manipulation';

/**
 * == INTERFACES AND TYPES ==
 */
interface LatestMedia {
  [key: string]: BaseItemDto[];
}

export interface HomeSection {
  name: string;
  libraryName?: string | null;
  libraryId: string;
  shape: CardShapes;
  type: string;
}

interface HomeSections {
  audioResumes: BaseItemDto[];
  videoResumes: BaseItemDto[];
  upNext: BaseItemDto[];
  latestMedia: LatestMedia;
}

interface UserLibrariesState {
  views: BaseItemDto[];
  homeSections: HomeSections;
  carouselItems: BaseItemDto[];
  isReady: boolean;
}

/**
 * == UTILITY VARIABLES ==
 */
const storeKey = 'userLibraries';

/**
 * == CLASS CONSTRUCTOR ==
 */
class UserLibrariesStore {
  /**
   * == STATE SECTION ==
   */
  private _defaultState: UserLibrariesState = {
    views: [],
    homeSections: {
      audioResumes: [],
      videoResumes: [],
      upNext: [],
      latestMedia: {}
    },
    carouselItems: [],
    isReady: false
  };

  private _state: RemovableRef<UserLibrariesState> = useStorage(
    storeKey,
    structuredClone(this._defaultState),
    sessionStorage,
    {
      mergeDefaults: (storageValue, defaults) =>
        mergeExcludingUnknown(storageValue, defaults)
    }
  );
  /**
   * == GETTERS AND SETTERS==
   */
  public get libraries(): typeof this._state.value.views {
    return this._state.value.views;
  }
  public get isReady(): typeof this._state.value.isReady {
    return this._state.value.isReady;
  }
  public get carouselItems(): typeof this._state.value.carouselItems {
    return this._state.value.carouselItems;
  }

  public getHomeSectionContent = (section: HomeSection): BaseItemDto[] => {
    return computed<BaseItemDto[]>(() => {
      switch (section.type) {
        case 'libraries': {
          return this.libraries;
        }
        case 'resume': {
          return this._state.value.homeSections.videoResumes;
        }
        case 'resumeaudio': {
          return this._state.value.homeSections.audioResumes;
        }
        case 'upnext': {
          return this._state.value.homeSections.upNext;
        }
        case 'latestmedia': {
          return this._state.value.homeSections.latestMedia[section.libraryId];
        }
        default: {
          return [];
        }
      }
    }).value;
  };

  /**
   * == ACTIONS ==
   */
  private _onError = (error: unknown): void => {
    const { t } = usei18n();

    console.error(error);
    useSnackbar(t('errors.anErrorHappened'), 'error');
  };

  private _updateUserViews = async (): Promise<void> => {
    const remote = useRemote();

    try {
      const userViewsResponse = await remote.sdk
        .newUserApi(getUserViewsApi)
        .getUserViews({
          userId: remote.auth.currentUserId ?? ''
        });

      this._state.value.views = userViewsResponse.data.Items ?? [];
    } catch (error) {
      this._onError(error);
    }
  };

  private _updateAudioResumes = async (): Promise<void> => {
    const remote = useRemote();

    try {
      const audioResumes = (
        await remote.sdk.newUserApi(getItemsApi).getResumeItems({
          userId: remote.auth.currentUserId ?? '',
          fields: [
            ItemFields.PrimaryImageAspectRatio,
            ItemFields.MediaSources,
            ItemFields.ProviderIds
          ],
          imageTypeLimit: 1,
          enableImageTypes: [
            ImageType.Primary,
            ImageType.Backdrop,
            ImageType.Thumb
          ],
          enableTotalRecordCount: false,
          mediaTypes: ['Audio']
        })
      ).data.Items;

      this._state.value.homeSections.audioResumes = audioResumes ?? [];
    } catch (error) {
      this._onError(error);
    }
  };

  private _updateVideoResumes = async (): Promise<void> => {
    const remote = useRemote();

    try {
      const videoResumes = (
        await remote.sdk.newUserApi(getItemsApi).getResumeItems({
          userId: remote.auth.currentUserId ?? '',
          fields: [
            ItemFields.PrimaryImageAspectRatio,
            ItemFields.MediaSources,
            ItemFields.ProviderIds
          ],
          imageTypeLimit: 1,
          enableImageTypes: [
            ImageType.Primary,
            ImageType.Backdrop,
            ImageType.Thumb
          ],
          enableTotalRecordCount: false,
          mediaTypes: ['Video']
        })
      ).data.Items;

      this._state.value.homeSections.videoResumes = videoResumes ?? [];
    } catch (error) {
      this._onError(error);
    }
  };

  private _updateUpNext = async (libraryId?: string): Promise<void> => {
    const remote = useRemote();

    try {
      const upNext = (
        await remote.sdk.newUserApi(getTvShowsApi).getNextUp({
          userId: remote.auth.currentUserId,
          fields: [
            ItemFields.PrimaryImageAspectRatio,
            ItemFields.MediaSources,
            ItemFields.ProviderIds
          ],
          imageTypeLimit: 1,
          enableImageTypes: [
            ImageType.Primary,
            ImageType.Backdrop,
            ImageType.Thumb
          ],
          parentId: libraryId
        })
      ).data.Items;

      this._state.value.homeSections.upNext = [
        ...this._state.value.homeSections.upNext,
        ...(upNext ?? [])
      ];
    } catch (error) {
      this._onError(error);
    }
  };

  private _updateLatestMedia = async (libraryId: string): Promise<void> => {
    const remote = useRemote();

    try {
      const latestMedia = (
        await remote.sdk.newUserApi(getUserLibraryApi).getLatestMedia({
          userId: remote.auth.currentUserId ?? '',
          fields: [
            ItemFields.PrimaryImageAspectRatio,
            ItemFields.MediaSources,
            ItemFields.ProviderIds
          ],
          imageTypeLimit: 1,
          enableImageTypes: [
            ImageType.Primary,
            ImageType.Backdrop,
            ImageType.Thumb
          ],
          parentId: libraryId
        })
      ).data;

      this._state.value.homeSections.latestMedia[libraryId] = latestMedia;
    } catch (error) {
      this._onError(error);
    }
  };

  private _updateIndexCarouselItems = async (): Promise<void> => {
    const remote = useRemote();

    try {
      const carouselItems = (
        await remote.sdk.newUserApi(getUserLibraryApi).getLatestMedia({
          userId: remote.auth.currentUserId ?? '',
          fields: [
            ItemFields.Overview,
            ItemFields.PrimaryImageAspectRatio,
            ItemFields.MediaSources,
            ItemFields.ProviderIds
          ],
          enableImageTypes: [ImageType.Backdrop, ImageType.Logo],
          imageTypeLimit: 1
        })
      ).data;

      this._state.value.carouselItems = carouselItems;
    } catch (error) {
      this._onError(error);
    }
  };

  public refresh = async (): Promise<void> => {
    this._state.value.homeSections.upNext = [];

    const promises: Promise<void>[] = [
      this._updateUserViews(),
      this._updateAudioResumes(),
      this._updateVideoResumes(),
      this._updateIndexCarouselItems(),
      this._updateUpNext()
    ];

    for (const library of this.libraries) {
      if (library.Id) {
        promises.push(this._updateLatestMedia(library.Id));
      }
    }

    await Promise.all(promises);

    this._state.value.isReady = true;
  };

  private _clear = (): void => {
    Object.assign(this._state.value, this._defaultState);
  };

  public constructor() {
    const remote = useRemote();

    watch(
      () => remote.auth.currentUser,
      () => {
        if (!remote.auth.currentUser) {
          this._clear();
        }
      }
    );
  }
}

const userLibraries = new UserLibrariesStore();

export default userLibraries;
