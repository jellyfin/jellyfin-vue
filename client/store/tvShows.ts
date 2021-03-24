import Vue from 'vue';
import { ActionTree, GetterTree, MutationTree } from 'vuex';
import {
  BaseItemDto,
  BaseItemDtoQueryResult,
  ItemFields
} from '@jellyfin/client-axios';

export interface TvShowItem {
  /**
   * seasons: Stores an array of all seasons
   */
  seasons: BaseItemDto[];
  /**
   * seasonEpisodes: Stores an array for each season containing all the season episodes
   */
  seasonEpisodes: { [key: string]: BaseItemDto[] };
}

export interface TvShowsState {
  [key: string]: TvShowItem;
}

export const defaultState = (): TvShowsState => ({});

export const state = defaultState;

type AddSeasonsMutationPayload = {
  seasons: BaseItemDto[];
  itemId?: string;
};

type AddSeasonsEpisodesMutationPayload = {
  seasonEpisodes: BaseItemDto[];
  itemId: string;
  seasonItemId: string;
};

export const getters: GetterTree<TvShowsState, TvShowsState> = {
  getSeasons: (state) => (itemId: string): BaseItemDto[] => {
    return state[itemId]?.seasons;
  },
  getSeasonEpisodes: (state) => (
    itemId: string
  ): TvShowItem['seasonEpisodes'] => {
    return state[itemId]?.seasonEpisodes;
  }
};

export const mutations: MutationTree<TvShowsState> = {
  ADD_TVSHOW_SEASONS(
    state: TvShowsState,
    { seasons, itemId }: AddSeasonsMutationPayload
  ) {
    if (!itemId) {
      throw new Error('itemId is undefined');
    }

    Vue.set(state, itemId, {
      seasonEpisodes: state[itemId]?.seasonEpisodes || [],
      seasons
    });
  },
  ADD_TVSHOW_SEASON_EPISODES(
    state: TvShowsState,
    { seasonEpisodes, itemId, seasonItemId }: AddSeasonsEpisodesMutationPayload
  ) {
    if (!itemId) {
      throw new Error('itemId is undefined');
    }

    Vue.set(state, itemId, {
      seasons: state[itemId]?.seasons || [],
      seasonEpisodes: {
        ...state[itemId]?.seasonEpisodes,
        [seasonItemId]: seasonEpisodes
      }
    });
  },
  CLEAR_TVSHOWS(state: TvShowsState) {
    Object.assign(state, defaultState());
  }
};
export const actions: ActionTree<TvShowsState, TvShowsState> = {
  async getTvShows({ dispatch }, { itemId }: { itemId: string }) {
    try {
      const { data } = await this.$api.tvShows.getSeasons({
        userId: this.$auth.user?.Id,
        seriesId: itemId
      });

      dispatch('getTvShowsSuccess', {
        response: data,
        itemId
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      dispatch('getTvShowsFailure', error);
    }
  },
  getTvShowsSuccess(
    { dispatch, commit },
    {
      response,
      itemId
    }: {
      response: BaseItemDtoQueryResult;
      itemId: string;
    }
  ) {
    commit('ADD_TVSHOW_SEASONS', {
      seasons: response.Items,
      itemId
    } as AddSeasonsMutationPayload);

    response.Items?.forEach(async (season) => {
      await dispatch('getTvShowsSeasonEpisodes', { season, itemId });
    });
  },
  getTvShowsFailure: async ({ dispatch }, error) => {
    await dispatch(
      'snackbar/pushSnackbarMessage',
      {
        message: error.message,
        color: 'error'
      },
      {
        root: true
      }
    );
  },
  async getTvShowsSeasonEpisodes({ dispatch }, { season, itemId }) {
    try {
      const { data } = await this.$api.items.getItems({
        userId: this.$auth.user?.Id,
        parentId: season.Id,
        fields: [ItemFields.Overview]
      });

      dispatch('getTvShowsSeasonEpisodesSuccess', {
        response: data,
        itemId,
        seasonItemId: season.Id
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      dispatch('getTvShowsSeasonEpisodesFailure', error);
    }
  },
  getTvShowsSeasonEpisodesSuccess(
    { commit },
    {
      response,
      itemId,
      seasonItemId
    }: {
      response: BaseItemDtoQueryResult;
      itemId: string;
      seasonItemId: string;
    }
  ) {
    commit('ADD_TVSHOW_SEASON_EPISODES', {
      itemId,
      seasonEpisodes: response.Items,
      seasonItemId
    } as AddSeasonsEpisodesMutationPayload);
  },
  getTvShowsSeasonEpisodesFailure: async ({ dispatch }, error) => {
    await dispatch(
      'snackbar/pushSnackbarMessage',
      {
        message: error.message,
        color: 'error'
      },
      {
        root: true
      }
    );
  },
  clearTvShows({ commit }) {
    commit('CLEAR_TVSHOWS');
  }
};
