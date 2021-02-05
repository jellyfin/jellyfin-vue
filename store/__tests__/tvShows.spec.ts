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

test('When "ADD_TVSHOW_SEASONS" is committed, the seasons are added is set.', () => {
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

test('When "ADD_TVSHOW_SEASON_EPISODES" is committed, the episodes are added.', () => {
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

test('When "CLEAR_TVSHOWS" is committed, the store is cleared.', () => {
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

test('When getTvShowsSeasonEpisodesSuccess is called, showNavDrawer is set.', () => {
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

test('When clearTvShows is called, the store is cleared.', () => {
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
