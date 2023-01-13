import { computed, watch } from 'vue';
import { RemovableRef, useStorageAsync } from '@vueuse/core';
import { getUserViewsApi } from '@jellyfin/sdk/lib/utils/api/user-views-api';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/tv-shows-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import {
  BaseItemDto,
  ImageType,
  ItemFields
} from '@jellyfin/sdk/lib/generated-client';
import { CardShapes } from '~/utils/items';
import { useRemote, useSnackbar } from '@/composables';
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
  isReady: boolean;
}

/**
 * == STATE VARIABLES ==
 */
const defaultState: UserLibrariesState = {
  views: [],
  homeSections: {
    audioResumes: [],
    videoResumes: [],
    upNext: [],
    latestMedia: {}
  },
  isReady: false
};

const state: RemovableRef<UserLibrariesState> = useStorageAsync(
  'userLibraries',
  defaultState,
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
  public getHomeSectionContent(section: HomeSection): BaseItemDto[] {
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
  }
  /**
   * == ACTIONS ==
   */
  private async fetchUserViews(): Promise<void> {
    const remote = useRemote();

    try {
      const userViewsResponse = await remote.sdk
        .newUserApi(getUserViewsApi)
        .getUserViews({
          userId: remote.auth.currentUserId.value || ''
        });

      state.value.views = userViewsResponse.data.Items || [];
    } catch (error) {
      console.error(error);
    }
  }

  private async fetchAudioResumes(): Promise<void> {
    const remote = useRemote();

    try {
      const audioResumes = (
        await remote.sdk.newUserApi(getItemsApi).getResumeItems({
          userId: remote.auth.currentUserId.value || '',
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
      useSnackbar(error as string, 'error');
    }
  }

  private async fetchVideoResumes(): Promise<void> {
    const remote = useRemote();

    try {
      const videoResumes = (
        await remote.sdk.newUserApi(getItemsApi).getResumeItems({
          userId: remote.auth.currentUserId.value || '',
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
      useSnackbar(error as string, 'error');
    }
  }

  private async fetchUpNext(libraryId: string): Promise<void> {
    const remote = useRemote();

    try {
      const upNext = (
        await remote.sdk.newUserApi(getTvShowsApi).getNextUp({
          userId: remote.auth.currentUserId.value,
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
      useSnackbar(error as string, 'error');
    }
  }

  private async fetchLatestMedia(libraryId: string): Promise<void> {
    const remote = useRemote();

    try {
      const latestMedia = (
        await remote.sdk.newUserApi(getUserLibraryApi).getLatestMedia({
          userId: remote.auth.currentUserId.value || '',
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
      useSnackbar(error as string, 'error');
    }
  }

  public async refresh(): Promise<void> {
    await this.fetchUserViews();
    await this.fetchAudioResumes();
    await this.fetchVideoResumes();

    for (const library of this.libraries) {
      if (library.Id) {
        await this.fetchUpNext(library.Id);
        await this.fetchLatestMedia(library.Id);
      }
    }

    state.value.isReady = true;
  }

  public clear(): void {
    Object.assign(state.value, defaultState);
  }
}

const userViews = new UserLibrariesStore();

/**
 * == WATCHERS ==
 */

const remote = useRemote();

watch(
  () => remote.auth.currentUser,
  () => {
    if (!remote.auth.currentUser.value) {
      userViews.clear();
    }
  }
);

export default userViews;
