import { defineStore } from 'pinia';
import { getUserViewsApi } from '@jellyfin/sdk/lib/utils/api/user-views-api';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { getLibraryIcon } from '~/utils/items';
import { useRemote } from '@/composables';

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
      const remote = useRemote();

      try {
        const userViewsResponse = await remote.sdk
          .newUserApi(getUserViewsApi)
          .getUserViews({
            userId: remote.auth.currentUserId.value || ''
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
          title: view.Name || '',
          to: `/library/${view.Id}`
        };
      });
    }
  }
});
