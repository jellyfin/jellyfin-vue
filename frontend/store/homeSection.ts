import Vue from 'vue';
import { defineStore } from 'pinia';
import { authStore, userViewsStore, snackbarStore } from '.';
import { BaseItemDto, ImageType, ItemFields } from '@jellyfin/client-axios';
import { CardShapes } from '~/utils/items';

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
  libraries: BaseItemDto[];
  audioResumes: BaseItemDto[];
  videoResumes: BaseItemDto[];
  upNext: BaseItemDto[];
  latestMedia: LatestMedia;
}

export const homeSectionStore = defineStore('homeSection', {
  state: () => {
    return {
      libraries: [],
      audioResumes: [],
      videoResumes: [],
      upNext: [],
      latestMedia: {}
    } as HomeSectionState;
  },
  actions: {
    async getLibraries(): Promise<void> {
      const userViews = userViewsStore();
      await userViews.refreshUserViews();

      this.libraries = Array.from(userViews.views);
    },
    async getAudioResumes(): Promise<void> {
      const auth = authStore();
      const snackbar = snackbarStore();

      try {
        const audioResumes = (
          await this.$nuxt.$api.items.getResumeItems({
            userId: auth.currentUserId,
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
      } catch (err) {
        snackbar.push(err as string, 'error');
      }
    },
    async getVideoResumes(): Promise<void> {
      const auth = authStore();
      const snackbar = snackbarStore();

      try {
        const videoResumes = (
          await this.$nuxt.$api.items.getResumeItems({
            userId: auth.currentUserId,
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
      } catch (err) {
        snackbar.push(err as string, 'error');
      }
    },
    async getUpNext(libraryId: string): Promise<void> {
      const auth = authStore();
      const snackbar = snackbarStore();

      try {
        const upNext = (
          await this.$nuxt.$api.tvShows.getNextUp({
            userId: auth.currentUserId,
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
      } catch (err) {
        snackbar.push(err as string, 'error');
      }
    },
    async getLatestMedia(libraryId: string): Promise<void> {
      const auth = authStore();
      const snackbar = snackbarStore();

      try {
        const latestMedia = (
          await this.$nuxt.$api.userLibrary.getLatestMedia({
            userId: auth.currentUserId,
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

        Vue.set(this.latestMedia, libraryId, latestMedia);
      } catch (err) {
        snackbar.push(err as string, 'error');
      }
    }
  },
  getters: {
    getHomeSectionContent:
      (state) =>
      (section: HomeSection): BaseItemDto[] => {
        switch (section.type) {
          case 'libraries':
            return state.libraries;
          case 'resume':
            return state.videoResumes;
          case 'resumeaudio':
            return state.audioResumes;
          case 'upnext':
            return state.upNext;
          case 'latestmedia':
            return state.latestMedia[section.libraryId];
          default:
            return [];
        }
      }
  }
});
