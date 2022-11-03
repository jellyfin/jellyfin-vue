import { defineStore } from 'pinia';
import { BaseItemDto } from '@jellyfin/client-axios';
import { authStore } from '.';
import { getLibraryIcon } from '~/utils/items';

export interface UserViewsState {
  views: BaseItemDto[];
}

export const userViewsStore = defineStore('userViews', {
  state: () => {
    return {
      views: []
    } as UserViewsState;
  },
  actions: {
    async refreshUserViews(): Promise<void> {
      const auth = authStore();

      try {
        const userViewsResponse = await this.$nuxt.$api.userViews.getUserViews({
          userId: auth.currentUserId
        });

        this.views = userViewsResponse.data.Items || [];
      } catch (error) {
        console.error(error);
      }
    }
  },
  getters: {
    getNavigationDrawerItems: (state) => {
      return state.views.map((view: BaseItemDto) => {
        return {
          icon: getLibraryIcon(view.CollectionType),
          title: view.Name,
          to: `/library/${view.Id}`
        };
      });
    }
  }
});
