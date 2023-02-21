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
import { cloneDeep } from 'lodash-es';
import { CardShapes } from '@/utils/items';
import { usei18n, useRemote, useSnackbar } from '@/composables';
import { mergeExcludingUnknown } from '@/utils/data-manipulation';

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
 * == STATE VARIABLES ==
 */
const storeKey = 'userLibraries';
const defaultState: UserLibrariesState = {
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

const state: RemovableRef<UserLibrariesState> = useStorage(
  storeKey,
  cloneDeep(defaultState),
  sessionStorage,
  {
    mergeDefaults: (storageValue, defaults) =>
      mergeExcludingUnknown(storageValue, defaults)
  }
);

class UserLibrariesStore {
  /**
   * == GETTERS ==
   */
  public get libraries(): typeof state.value.views {
    return state.value.views;
  }
  public get isReady(): typeof state.value.isReady {
    return state.value.isReady;
  }
  public get carouselItems(): typeof state.value.carouselItems {
    return state.value.carouselItems;
  }

  public getHomeSectionContent = (section: HomeSection): BaseItemDto[] => {
    return computed<BaseItemDto[]>(() => {
      switch (section.type) {
        case 'libraries': {
          return this.libraries;
        }
        case 'resume': {
          return state.value.homeSections.videoResumes;
        }
        case 'resumeaudio': {
          return state.value.homeSections.audioResumes;
        }
        case 'upnext': {
          return state.value.homeSections.upNext;
        }
        case 'latestmedia': {
          return state.value.homeSections.latestMedia[section.libraryId];
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
  private _fetchUserViews = async (): Promise<void> => {
    const remote = useRemote();
    const { t } = usei18n();

    try {
      const userViewsResponse = await remote.sdk
        .newUserApi(getUserViewsApi)
        .getUserViews({
          userId: remote.auth.currentUserId || ''
        });

      state.value.views = userViewsResponse.data.Items || [];
    } catch (error) {
      console.error(error);
      useSnackbar(t('errors.anErrorHappened'), 'error');
    }
  };

  private _fetchAudioResumes = async (): Promise<void> => {
    const remote = useRemote();
    const { t } = usei18n();

    try {
      const audioResumes = (
        await remote.sdk.newUserApi(getItemsApi).getResumeItems({
          userId: remote.auth.currentUserId || '',
          limit: 24,
          fields: [ItemFields.PrimaryImageAspectRatio],
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

      if (audioResumes) {
        state.value.homeSections.audioResumes = audioResumes;
      }
    } catch (error) {
      console.error(error);
      useSnackbar(t('errors.anErrorHappened'), 'error');
    }
  };

  private _fetchVideoResumes = async (): Promise<void> => {
    const remote = useRemote();
    const { t } = usei18n();

    try {
      const videoResumes = (
        await remote.sdk.newUserApi(getItemsApi).getResumeItems({
          userId: remote.auth.currentUserId || '',
          limit: 24,
          fields: [ItemFields.PrimaryImageAspectRatio],
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

      if (videoResumes) {
        state.value.homeSections.videoResumes = videoResumes;
      }
    } catch (error) {
      console.error(error);
      useSnackbar(t('errors.anErrorHappened'), 'error');
    }
  };

  private _fetchUpNext = async (libraryId: string): Promise<void> => {
    const remote = useRemote();
    const { t } = usei18n();

    try {
      const upNext = (
        await remote.sdk.newUserApi(getTvShowsApi).getNextUp({
          userId: remote.auth.currentUserId,
          limit: 24,
          fields: [ItemFields.PrimaryImageAspectRatio],
          imageTypeLimit: 1,
          enableImageTypes: [
            ImageType.Primary,
            ImageType.Backdrop,
            ImageType.Thumb
          ],
          parentId: libraryId
        })
      ).data.Items;

      if (upNext) {
        state.value.homeSections.upNext = upNext;
      }
    } catch (error) {
      console.error(error);
      useSnackbar(t('errors.anErrorHappened'), 'error');
    }
  };

  private _fetchLatestMedia = async (libraryId: string): Promise<void> => {
    const remote = useRemote();
    const { t } = usei18n();

    try {
      const latestMedia = (
        await remote.sdk.newUserApi(getUserLibraryApi).getLatestMedia({
          userId: remote.auth.currentUserId || '',
          limit: 24,
          fields: [ItemFields.PrimaryImageAspectRatio],
          imageTypeLimit: 1,
          enableImageTypes: [
            ImageType.Primary,
            ImageType.Backdrop,
            ImageType.Thumb
          ],
          parentId: libraryId
        })
      ).data;

      state.value.homeSections.latestMedia[libraryId] = latestMedia;
    } catch (error) {
      console.error(error);
      useSnackbar(t('errors.anErrorHappened'), 'error');
    }
  };

  private _fetchIndexCarouselItems = async (): Promise<void> => {
    const remote = useRemote();
    const { t } = usei18n();

    try {
      const carouselItems = (
        await remote.sdk.newUserApi(getUserLibraryApi).getLatestMedia({
          userId: remote.auth.currentUserId || '',
          limit: 10,
          fields: [ItemFields.Overview, ItemFields.PrimaryImageAspectRatio],
          enableImageTypes: [ImageType.Backdrop, ImageType.Logo],
          imageTypeLimit: 1
        })
      ).data;

      if (carouselItems) {
        state.value.carouselItems = carouselItems;
      }
    } catch (error) {
      console.error(error);
      useSnackbar(t('errors.anErrorHappened'), 'error');
    }
  };

  public refresh = async (): Promise<void> => {
    await this._fetchUserViews();
    await this._fetchAudioResumes();
    await this._fetchVideoResumes();
    await this._fetchIndexCarouselItems();

    for (const library of this.libraries) {
      if (library.Id) {
        await this._fetchUpNext(library.Id);
        await this._fetchLatestMedia(library.Id);
      }
    }

    state.value.isReady = true;
  };

  public clear = (): void => {
    Object.assign(state.value, defaultState);
  };
}

const userLibraries = new UserLibrariesStore();

/**
 * == WATCHERS ==
 */

const remote = useRemote();

watch(
  () => remote.auth.currentUser,
  () => {
    if (!remote.auth.currentUser) {
      userLibraries.clear();
    }
  }
);

export default userLibraries;
