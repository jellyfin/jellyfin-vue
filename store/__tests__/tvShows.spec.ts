import Vue, { VueConstructor } from 'vue';
import { createLocalVue } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';
import { cloneDeep } from 'lodash';
import { BaseItemDto, BaseItemDtoQueryResult } from '@jellyfin/client-axios';
import {
  state,
  mutations,
  getters,
  TvShowsState,
  defaultState,
  actions
} from '../tvShows';

let localVue: VueConstructor<Vue>;
let store: Store<TvShowsState>;

const TEST_TV_SERIES = {
  Id: 'series-id-1'
} as BaseItemDto;

const TEST_TV_SEASON_1 = {
  Id: 'season-id-1',
  ParentId: 'series-id-1'
} as BaseItemDto;

const TEST_TV_SEASON_2 = {
  Id: 'season-id-2',
  ParentId: 'series-id-1'
} as BaseItemDto;

const TEST_TV_EPISODE_1 = {
  Id: 'episode-id-1',
  ParentId: 'season-id-2'
} as BaseItemDto;

const TEST_TV_EPISODE_2 = {
  Id: 'episode-id-1',
  ParentId: 'season-id-2'
} as BaseItemDto;

beforeEach(() => {
  localVue = createLocalVue();
  localVue.use(Vuex);

  store = new Vuex.Store(cloneDeep({ state, mutations, getters, actions }));
});

describe('vuex: tvShows', () => {
  it('adds the seasons when "ADD_TVSHOW_SEASONS" is committed', () => {
    store.replaceState({ ...defaultState() });

    store.commit('ADD_TVSHOW_SEASONS', {
      seasons: [TEST_TV_SEASON_1, TEST_TV_SEASON_2],
      itemId: TEST_TV_SERIES.Id
    });

    expect(store.state[TEST_TV_SERIES.Id || ''].seasons).toMatchObject([
      TEST_TV_SEASON_1,
      TEST_TV_SEASON_2
    ]);
  });

  it('adds episodes to a season when "ADD_TVSHOW_SEASON_EPISODES" is committed', () => {
    store.replaceState({ ...defaultState() });

    store.commit('ADD_TVSHOW_SEASON_EPISODES', {
      seasonEpisodes: [TEST_TV_EPISODE_1, TEST_TV_EPISODE_2],
      itemId: [TEST_TV_SERIES.Id],
      seasonItemId: TEST_TV_SEASON_1.Id
    });

    expect(store.state[TEST_TV_SERIES.Id || ''].seasonEpisodes).toMatchObject({
      [TEST_TV_SEASON_1.Id || '']: [TEST_TV_EPISODE_1, TEST_TV_EPISODE_2]
    });
  });

  it('clears the store when "CLEAR_TVSHOWS" is committed', () => {
    store.replaceState({
      [TEST_TV_SERIES.Id || '']: {
        seasons: [TEST_TV_SEASON_1, TEST_TV_SEASON_2],
        seasonEpisodes: {
          [TEST_TV_SEASON_1.Id || '']: [TEST_TV_EPISODE_1, TEST_TV_EPISODE_2]
        }
      }
    });

    store.commit('CLEAR_TVSHOWS');

    expect(store.state).toMatchObject(defaultState());
  });

  it('sets the show, seasons and episodes <hen getTvShowsSeasonEpisodesSuccess is dispatched', () => {
    store.replaceState({ ...defaultState() });

    store.dispatch('getTvShowsSeasonEpisodesSuccess', {
      response: {
        Items: [TEST_TV_EPISODE_1, TEST_TV_EPISODE_2]
      } as BaseItemDtoQueryResult,
      itemId: TEST_TV_SERIES.Id,
      seasonItemId: TEST_TV_SEASON_1.Id
    });

    expect(store.state[TEST_TV_SERIES.Id || ''].seasonEpisodes).toMatchObject({
      [TEST_TV_SEASON_1.Id || '']: [TEST_TV_EPISODE_1, TEST_TV_EPISODE_2]
    });
  });

  it('clears the store when clearTvShows is dispatched', () => {
    store.replaceState({
      [TEST_TV_SERIES.Id || '']: {
        seasons: [TEST_TV_SEASON_1, TEST_TV_SEASON_2],
        seasonEpisodes: {
          [TEST_TV_SEASON_1.Id || '']: [TEST_TV_EPISODE_1, TEST_TV_EPISODE_2]
        }
      }
    });

    store.dispatch('clearTvShows');

    expect(store.state).toMatchObject(defaultState());
  });
});
