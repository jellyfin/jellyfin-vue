import Vue from 'vue';
import { ActionTree, GetterTree, MutationTree } from 'vuex';
import {
  BaseItemDto,
  BaseItemDtoQueryResult,
  ItemFields
} from '@jellyfin/client-axios';
import { AppState } from './index';

interface TvShowItem {
  /**
   * seasons: Stores an array of all seasons
   */
  seasons: BaseItemDto[];
  /**
   * seasonEpisodes: Stores an array for each season containing all the season episodes
   */
  seasonEpisodes: BaseItemDto[][];
}

export interface TvShowsState {
  [key: string]: TvShowItem;
}

const defaultState = (): TvShowsState => ({});

export const state = defaultState;

type MutationPayload = {
  seasons: BaseItemDto[];
  seasonEpisodes: BaseItemDto[];
  itemId?: string;
};

export const getters: GetterTree<TvShowsState, AppState> = {
  getSeasons: (state) => ({ itemId }: { itemId: string }): BaseItemDto[] => {
    return state[itemId]?.seasons;
  },
  getSeasonEpisodes: (state) => ({
    itemId
  }: {
    itemId: string;
  }): BaseItemDto[][] => {
    return state[itemId]?.seasonEpisodes;
  }
};

export const mutations: MutationTree<TvShowsState> = {
  ADD_TVSHOW_SEASONS(
    state: TvShowsState,
    { seasons, itemId }: MutationPayload
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
    { seasonEpisodes, itemId }: MutationPayload
  ) {
    if (!itemId) {
      throw new Error('itemId is undefined');
    }

    Vue.set(state, itemId, {
      seasons: state[itemId]?.seasons || [],
      seasonEpisodes: [...state[itemId].seasonEpisodes, seasonEpisodes]
    });
  },
  CLEAR_TVSHOWS(state: TvShowsState) {
    Object.assign(state, defaultState());
  }
};
export const actions: ActionTree<TvShowsState, AppState> = {
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
    });

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
        itemId
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      dispatch('getTvShowsSeasonEpisodesFailure', error);
    }
  },
  getTvShowsSeasonEpisodesSuccess(
    { commit },
    { response, itemId }: { response: BaseItemDtoQueryResult; itemId: string }
  ) {
    commit('ADD_TVSHOW_SEASON_EPISODES', {
      itemId,
      seasonEpisodes: response.Items
    });
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
