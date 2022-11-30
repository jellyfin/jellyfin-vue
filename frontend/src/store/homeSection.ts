import { defineStore } from 'pinia';
import {
  BaseItemDto,
  ImageType,
  ItemFields
} from '@jellyfin/sdk/lib/generated-client';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/tv-shows-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { userViewsStore } from '.';
import { CardShapes } from '~/utils/items';
import { useRemote, useSnackbar } from '@/composables';

export interface HomeSection {
  name: string;
  libraryName?: string | null;
  libraryId: string;
  shape: CardShapes;
  type: string;
}

interface LatestMedia {
  [key: string]: BaseItemDto[];
}

export interface HomeSectionState {
  audioResumes: BaseItemDto[];
  videoResumes: BaseItemDto[];
  upNext: BaseItemDto[];
  latestMedia: LatestMedia;
}

export const homeSectionStore = defineStore('homeSection', {
  state: () => {
    return {
      audioResumes: [],
      videoResumes: [],
      upNext: [],
      latestMedia: {}
    } as HomeSectionState;
  },
  actions: {
    async getAudioResumes(): Promise<void> {
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
          this.audioResumes = audioResumes;
        }
      } catch (error) {
        useSnackbar(error as string, 'error');
      }
    },
    async getVideoResumes(): Promise<void> {
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
          this.videoResumes = videoResumes;
        }
      } catch (error) {
        useSnackbar(error as string, 'error');
      }
    },
    async getUpNext(libraryId: string): Promise<void> {
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
          this.upNext = upNext;
        }
      } catch (error) {
        useSnackbar(error as string, 'error');
      }
    },
    async getLatestMedia(libraryId: string): Promise<void> {
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

        this.latestMedia[libraryId] = latestMedia;
      } catch (error) {
        useSnackbar(error as string, 'error');
      }
    }
  },
  getters: {
    libraries: (): BaseItemDto[] => {
      const userViews = userViewsStore();

      return [...userViews.views];
    },
    getHomeSectionContent() {
      return (section: HomeSection): BaseItemDto[] => {
        switch (section.type) {
          case 'libraries': {
            return this.libraries;
          }
          case 'resume': {
            return this.videoResumes;
          }
          case 'resumeaudio': {
            return this.audioResumes;
          }
          case 'upnext': {
            return this.upNext;
          }
          case 'latestmedia': {
            return this.latestMedia[section.libraryId];
          }
          default: {
            return [];
          }
        }
      };
    }
  }
});
