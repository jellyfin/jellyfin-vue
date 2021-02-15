import Vue, { VueConstructor } from 'vue';
import { createLocalVue } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';
import { cloneDeep } from 'lodash';
import {
  BaseItemDto,
  MediaSourceInfo,
  MediaSourceType,
  RepeatMode
} from '@jellyfin/client-axios';
import {
  state,
  mutations,
  actions,
  PlaybackManagerState,
  PlaybackStatus,
  defaultState,
  getters,
  InitMode
} from '../playbackManager';

const DEMO_TEST_ITEM_A = {
  Name: 'demo item 1',
  Id: 'demo-item-1',
  Type: 'Movie',
  MediaType: 'demo-item-1-media-type'
} as BaseItemDto;

const DEMO_TEST_ITEM_B = {
  Name: 'demo item 2',
  Id: 'demo-item-2'
} as BaseItemDto;

const DEMO_TEST_ITEM_C = {
  Name: 'demo item 3',
  Id: 'demo-item-3'
} as BaseItemDto;

const DEMO_TEST_MEDIA_SOURCE = {
  duration: 500,
  Id: 'demo-media-source-id',
  Type: MediaSourceType.Default
} as MediaSourceInfo;

let localVue: VueConstructor<Vue>;
let store: Store<PlaybackManagerState>;

beforeEach(() => {
  localVue = createLocalVue();
  localVue.use(Vuex);

  store = new Vuex.Store(cloneDeep({ state, mutations, actions, getters }));
});

test('When getCurrentItem is called, the current item is returned', () => {
  store.replaceState({
    ...defaultState(),
    queue: [DEMO_TEST_ITEM_A, DEMO_TEST_ITEM_B, DEMO_TEST_ITEM_C],
    currentItemIndex: 1
  });

  expect(store.getters.getCurrentItem).toMatchObject(DEMO_TEST_ITEM_B);

  store.replaceState({
    ...defaultState()
  });

  expect(store.getters.getCurrentItem).toBeNull();
});

test('When getPreviousItem is called, the previous item is returned', () => {
  store.replaceState({
    ...defaultState(),
    queue: [DEMO_TEST_ITEM_A, DEMO_TEST_ITEM_B, DEMO_TEST_ITEM_C],
    currentItemIndex: 0
  });

  expect(store.getters.getPreviousItem).toBeNull();

  store.replaceState({
    ...defaultState(),
    queue: [DEMO_TEST_ITEM_A, DEMO_TEST_ITEM_B, DEMO_TEST_ITEM_C],
    currentItemIndex: 1,
    lastItemIndex: null
  });

  expect(store.getters.getPreviousItem).toBeNull();

  store.replaceState({
    ...defaultState(),
    queue: [DEMO_TEST_ITEM_A, DEMO_TEST_ITEM_B, DEMO_TEST_ITEM_C],
    currentItemIndex: 1,
    lastItemIndex: 0
  });

  expect(store.getters.getCurrentItem).toMatchObject(DEMO_TEST_ITEM_B);
});

test('When getNextItem is called, the next item is returned', () => {
  store.replaceState({
    ...defaultState(),
    queue: [DEMO_TEST_ITEM_A, DEMO_TEST_ITEM_B, DEMO_TEST_ITEM_C],
    currentItemIndex: 0
  });

  expect(store.getters.getNextItem).toMatchObject(DEMO_TEST_ITEM_B);

  store.replaceState({
    ...defaultState(),
    queue: [DEMO_TEST_ITEM_A, DEMO_TEST_ITEM_B, DEMO_TEST_ITEM_C],
    currentItemIndex: 2,
    repeatMode: RepeatMode.RepeatAll
  });

  expect(store.getters.getNextItem).toMatchObject(DEMO_TEST_ITEM_A);

  store.replaceState({
    ...defaultState(),
    queue: [DEMO_TEST_ITEM_A, DEMO_TEST_ITEM_B, DEMO_TEST_ITEM_C],
    currentItemIndex: 2
  });

  expect(store.getters.getNextItem).toBeNull();
});

test('When getCurrentlyPlayingType is called, it returns the correct type', () => {
  store.replaceState({
    ...defaultState(),
    queue: [DEMO_TEST_ITEM_A, DEMO_TEST_ITEM_B, DEMO_TEST_ITEM_C],
    currentItemIndex: 0
  });

  expect(store.getters.getCurrentlyPlayingType).toBe('Movie');

  store.replaceState({
    ...defaultState()
  });

  expect(store.getters.getCurrentlyPlayingType).toBeNull();
});

test('When getCurrentlyPlayingMediaType is called, it returns the correct type', () => {
  store.replaceState({
    ...defaultState(),
    queue: [DEMO_TEST_ITEM_A, DEMO_TEST_ITEM_B, DEMO_TEST_ITEM_C],
    currentItemIndex: 0
  });

  expect(store.getters.getCurrentlyPlayingMediaType).toBe(
    'demo-item-1-media-type'
  );

  store.replaceState({
    ...defaultState()
  });

  expect(store.getters.getCurrentlyPlayingMediaType).toBeNull();
});

test('When "SET_QUEUE" is committed, que is set.', () => {
  store.replaceState({ ...defaultState() });

  store.commit('SET_QUEUE', {
    ...defaultState(),
    queue: [DEMO_TEST_ITEM_A, DEMO_TEST_ITEM_B, DEMO_TEST_ITEM_C]
  });

  expect(store.state.queue).toMatchObject([
    DEMO_TEST_ITEM_A,
    DEMO_TEST_ITEM_B,
    DEMO_TEST_ITEM_C
  ]);
});

test('When "ADD_TO_QUEUE" is committed, the list of items is added to the queue. Case A', () => {
  store.replaceState({
    ...defaultState()
  });

  store.commit('ADD_TO_QUEUE', {
    queue: [DEMO_TEST_ITEM_B, DEMO_TEST_ITEM_A]
  });

  expect(store.state.queue).toMatchObject([DEMO_TEST_ITEM_B, DEMO_TEST_ITEM_A]);
});

test('When "ADD_TO_QUEUE" is committed, the list of items is added to the queue. Case B', () => {
  store.replaceState({
    ...defaultState(),
    queue: [DEMO_TEST_ITEM_A, DEMO_TEST_ITEM_B]
  });

  store.commit('ADD_TO_QUEUE', {
    queue: [DEMO_TEST_ITEM_B]
  });

  expect(store.state.queue).toMatchObject([
    DEMO_TEST_ITEM_A,
    DEMO_TEST_ITEM_B,
    DEMO_TEST_ITEM_B
  ]);
});

test('When "CLEAR_QUEUE" is committed, queue is cleared.', () => {
  store.replaceState({
    ...defaultState(),
    queue: [DEMO_TEST_ITEM_A, DEMO_TEST_ITEM_B]
  });

  store.commit('CLEAR_QUEUE');

  expect(store.state.queue).toMatchObject([]);
});

test('When "SET_CURRENT_ITEM_INDEX" is committed, queue is cleared.', () => {
  store.replaceState({
    ...defaultState(),
    queue: [
      DEMO_TEST_ITEM_A,
      DEMO_TEST_ITEM_B,
      DEMO_TEST_ITEM_C,
      DEMO_TEST_ITEM_A
    ],
    currentItemIndex: 3
  });

  store.commit('SET_CURRENT_ITEM_INDEX', { currentItemIndex: 5 });

  expect(store.state.lastItemIndex).toBe(3);
  expect(store.state.currentItemIndex).toBe(5);
});

test('When "SET_CURRENT_MEDIA_SOURCE" is committed, queue is cleared.', () => {
  store.replaceState({
    ...defaultState()
  });

  store.commit('SET_CURRENT_MEDIA_SOURCE', {
    mediaSource: DEMO_TEST_MEDIA_SOURCE
  });

  expect(store.state.currentMediaSource).toMatchObject(DEMO_TEST_MEDIA_SOURCE);
});

test('When "INCREASE_QUEUE_INDEX" is committed, currentItemIndex is increased. Case A', () => {
  store.replaceState({
    ...defaultState()
  });

  store.commit('INCREASE_QUEUE_INDEX');

  expect(store.state.currentItemIndex).toBeNull();
});

test('When "INCREASE_QUEUE_INDEX" is committed, currentItemIndex is increased. Case B', () => {
  store.replaceState({
    ...defaultState(),
    currentItemIndex: 1,
    lastItemIndex: 0
  });

  store.commit('INCREASE_QUEUE_INDEX');

  expect(store.state.currentItemIndex).toBe(2);
  expect(store.state.lastItemIndex).toBe(1);
});

test('When "DECREASE_QUEUE_INDEX" is committed, currentItemIndex is decreased. Case A', () => {
  store.replaceState({
    ...defaultState()
  });

  store.commit('DECREASE_QUEUE_INDEX');

  expect(store.state.currentItemIndex).toBeNull();
});

test('When "DECREASE_QUEUE_INDEX" is committed, currentItemIndex is decreased. Case B', () => {
  store.replaceState({
    ...defaultState(),
    currentItemIndex: 2
  });

  store.commit('DECREASE_QUEUE_INDEX');

  expect(store.state.currentItemIndex).toBe(1);
});

test('When "START_PLAYBACK" is committed, status is set to playing.', () => {
  store.replaceState({
    ...defaultState()
  });

  store.commit('START_PLAYBACK', { initMode: InitMode.Unknown });

  expect(store.state.status).toBe(PlaybackStatus.playing);
});

test('When "UNPAUSE_PLAYBACK" is committed, status is set to playing.', () => {
  store.replaceState({
    ...defaultState()
  });

  store.commit('UNPAUSE_PLAYBACK');

  expect(store.state.status).toBe(PlaybackStatus.playing);
});

test('When "PAUSE_PLAYBACK" is committed, status is set to playing.', () => {
  store.replaceState({
    ...defaultState(),
    status: PlaybackStatus.playing
  });

  store.commit('PAUSE_PLAYBACK');

  expect(store.state.status).toBe(PlaybackStatus.paused);
});

test('When "STOP_PLAYBACK" is committed, status is set back to default.', () => {
  store.replaceState({
    ...defaultState(),
    status: PlaybackStatus.playing
  });

  store.commit('STOP_PLAYBACK');

  expect(store.state).toMatchObject(defaultState());
});

test('When "RESET_LAST_ITEM_INDEX" is committed, lastItemIndex is set to null', () => {
  store.replaceState({
    ...defaultState(),
    lastItemIndex: 10
  });

  store.commit('RESET_LAST_ITEM_INDEX');

  expect(store.state.lastItemIndex).toBeNull();
});

test('When "SET_VOLUME" is committed, volume level is set.', () => {
  store.replaceState({
    ...defaultState()
  });

  store.commit('SET_VOLUME', { volume: 10 });

  expect(store.state.currentVolume).toBe(10);
});

test('When "SET_MINIMIZE" is committed, isMinimized is set. Case A', () => {
  store.replaceState({
    ...defaultState(),
    isMinimized: false
  });

  store.commit('SET_MINIMIZE', { minimized: true });

  expect(store.state.isMinimized).toBe(true);
});

test('When "SET_MINIMIZE" is committed, isMinimized is set. Case B', () => {
  store.replaceState({
    ...defaultState(),
    isMinimized: true
  });

  store.commit('SET_MINIMIZE', { minimized: false });

  expect(store.state.isMinimized).toBe(false);
});

test('When "SET_CURRENT_TIME" is committed, currentTime is set.', () => {
  store.replaceState({
    ...defaultState()
  });

  store.commit('SET_CURRENT_TIME', { time: 1.234 });

  expect(store.state.currentTime).toBe(1.234);
});

test('When "CHANGE_CURRENT_TIME" is committed, currentTime is set.', () => {
  store.replaceState({
    ...defaultState()
  });

  store.commit('CHANGE_CURRENT_TIME', { time: 1.234 });

  expect(store.state.currentTime).toBe(1.234);
});

test('When "TOGGLE_MINIMIZE" is committed, currentTime is set.', () => {
  store.replaceState({
    ...defaultState(),
    isMinimized: false
  });

  store.commit('TOGGLE_MINIMIZE');

  expect(store.state.isMinimized).toBe(true);

  store.commit('TOGGLE_MINIMIZE');

  expect(store.state.isMinimized).toBe(false);
});

test('When "SET_PLAY_SESSION_ID" is is called, the playSessionId is set.', () => {
  store.replaceState({
    ...defaultState()
  });

  store.commit('SET_PLAY_SESSION_ID', { id: 'demo-play-session-id' });

  expect(store.state.playSessionId).toBe('demo-play-session-id');
});

test('When stop is is called, status is set to stopped.', () => {
  store.replaceState({
    ...defaultState(),
    status: PlaybackStatus.playing
  });

  store.dispatch('stop');

  expect(store.state.status).toBe(PlaybackStatus.stopped);
});

test('When pause is is called, status is set to paused.', () => {
  store.replaceState({
    ...defaultState(),
    status: PlaybackStatus.playing
  });

  store.dispatch('pause');

  expect(store.state.status).toBe(PlaybackStatus.paused);
});

test('When unpause is is called, status is set to playing.', () => {
  store.replaceState({
    ...defaultState(),
    status: PlaybackStatus.paused
  });

  store.dispatch('unpause');

  expect(store.state.status).toBe(PlaybackStatus.playing);
});

test('When playPause is is called, status is flipped.', () => {
  store.replaceState({
    ...defaultState(),
    status: PlaybackStatus.paused
  });

  store.dispatch('playPause');

  expect(store.state.status).toBe(PlaybackStatus.playing);

  store.dispatch('playPause');

  expect(store.state.status).toBe(PlaybackStatus.paused);
});

test('When clearQueue is is called, the queue is cleared', () => {
  store.replaceState({
    ...defaultState(),
    queue: [DEMO_TEST_ITEM_A, DEMO_TEST_ITEM_B]
  });

  store.dispatch('clearQueue');

  expect(store.state.queue).toMatchObject([]);
});

test('When setMediaSource is is called, the correct media source is set.', () => {
  store.replaceState({
    ...defaultState()
  });

  store.dispatch('setMediaSource', { mediaSource: DEMO_TEST_MEDIA_SOURCE });

  expect(store.state.currentMediaSource).toMatchObject(DEMO_TEST_MEDIA_SOURCE);
});

test('When setNextTrack is is called, the queue is cleared. Case A', () => {
  store.replaceState({
    ...defaultState(),
    queue: [DEMO_TEST_ITEM_A, DEMO_TEST_ITEM_B],
    status: PlaybackStatus.playing,
    currentItemIndex: 1
  });

  store.dispatch('setNextTrack');

  expect(store.state.status).toBe(PlaybackStatus.stopped);
});

test('When setNextTrack is is called, the queue is cleared. Case B', () => {
  store.replaceState({
    ...defaultState(),
    queue: [DEMO_TEST_ITEM_A, DEMO_TEST_ITEM_B],
    currentItemIndex: 0
  });

  store.dispatch('setNextTrack');

  expect(store.state.currentItemIndex).toBe(1);
  expect(store.state.lastItemIndex).toBe(0);
});

test('When setPreviousTrack is is called, the queue is cleared. Case A', () => {
  store.replaceState({
    ...defaultState(),
    currentTime: 5
  });

  store.dispatch('setPreviousTrack');

  expect(store.state.currentTime).toBe(0);
});

test('When setPreviousTrack is is called, the queue is cleared. Case B', () => {
  store.replaceState({
    ...defaultState(),
    currentTime: 1,
    currentItemIndex: 3
  });

  store.dispatch('setPreviousTrack');

  expect(store.state.currentItemIndex).toBe(2);
});

test('When setPreviousTrack is is called, the queue is cleared. Case C', () => {
  store.replaceState({
    ...defaultState(),
    currentTime: 1
  });

  store.dispatch('setPreviousTrack');

  expect(store.state.currentTime).toBe(0);
});

test('When resetCurrentTime is is called, the currentTime is set to 0.', () => {
  store.replaceState({
    ...defaultState(),
    currentTime: 1.234
  });

  store.dispatch('resetCurrentTime');

  expect(store.state.currentTime).toBe(0);
});

test('When resetCurrentItemIndex is is called, the currentItemIndex is set to null.', () => {
  store.replaceState({
    ...defaultState(),
    currentItemIndex: 1
  });

  store.dispatch('resetCurrentItemIndex');

  expect(store.state.currentItemIndex).toBeNull();
});

test('When setLastItemIndex is is called, the lastItemIndex is set to null.', () => {
  store.replaceState({
    ...defaultState(),
    lastItemIndex: 1,
    currentItemIndex: 2
  });

  store.dispatch('setLastItemIndex');

  expect(store.state.lastItemIndex).toBe(2);
});

test('When resetLastItemIndex is is called, the lastItemIndex is set to null.', () => {
  store.replaceState({
    ...defaultState(),
    lastItemIndex: 1
  });

  store.dispatch('resetLastItemIndex');

  expect(store.state.lastItemIndex).toBeNull();
});

test('When setLastProgressUpdate is is called, the state is updated.', () => {
  store.replaceState({
    ...defaultState()
  });

  store.dispatch('setLastProgressUpdate', { progress: 10 });

  expect(store.state.lastProgressUpdate).toBe(10);
});

test('When setVolume is is called, the volumeLevel is updated.', () => {
  store.replaceState({
    ...defaultState()
  });

  store.dispatch('setVolume', { volume: 10 });

  expect(store.state.currentVolume).toBe(10);
});

test('When setVolume is is called, the volumeLevel is updated. Case A', () => {
  store.replaceState({
    ...defaultState(),
    currentItemIndex: 5
  });

  store.dispatch('setCurrentIndex', { index: 5 });

  expect(store.state.currentItemIndex).toBe(5);
});

test('When setVolume is is called, the volumeLevel is updated. Case B', () => {
  store.replaceState({
    ...defaultState(),
    currentItemIndex: 5
  });

  store.dispatch('setCurrentIndex', { index: 6 });

  expect(store.state.currentItemIndex).toBe(6);
});

test('When setCurrentTime is is called, the currentTime is updated.', () => {
  store.replaceState({
    ...defaultState()
  });

  store.dispatch('setCurrentTime', { time: 12.345 });

  expect(store.state.currentTime).toBe(12.345);
});

test('When changeCurrentTime is is called, the currentTime is updated.', () => {
  store.replaceState({
    ...defaultState()
  });

  store.dispatch('changeCurrentTime', { time: 12.345 });

  expect(store.state.currentTime).toBe(12.345);
});

test('When skipForward is is called, the currentTime is updated.', () => {
  store.replaceState({
    ...defaultState(),
    currentTime: 10
  });

  store.dispatch('skipForward');

  expect(store.state.currentTime).toBe(25);
});

test('When skipBackward is is called, the currentTime is updated.', () => {
  store.replaceState({
    ...defaultState(),
    currentTime: 10
  });

  store.dispatch('skipBackward');

  expect(store.state.currentTime).toBe(0);
});

test('When skipBackward is is called, the currentTime is updated. Case B', () => {
  store.replaceState({
    ...defaultState(),
    currentTime: 25
  });

  store.dispatch('skipBackward');

  expect(store.state.currentTime).toBe(10);
});

test('When setMinimized is is called, isMinimized is updated.', () => {
  store.replaceState({
    ...defaultState(),
    isMinimized: false
  });

  store.dispatch('setMinimized', { minimized: true });

  expect(store.state.isMinimized).toBe(true);
});

test('When toggleMinimized is is called, isMinimized is toggled between.', () => {
  store.replaceState({
    ...defaultState(),
    isMinimized: false
  });

  store.dispatch('toggleMinimized');

  expect(store.state.isMinimized).toBe(true);

  store.dispatch('toggleMinimized');

  expect(store.state.isMinimized).toBe(false);
});

test('When setPlaySessionId is is called, the playSessionId is set.', () => {
  store.replaceState({
    ...defaultState()
  });

  store.dispatch('setPlaySessionId', { id: 'demo-play-session-id' });

  expect(store.state.playSessionId).toBe('demo-play-session-id');
});

test('When setRepeatMode is is called, the repeatMode is set.', () => {
  store.replaceState({
    ...defaultState()
  });

  store.dispatch('setRepeatMode', { mode: RepeatMode.RepeatAll });

  expect(store.state.repeatMode).toBe(RepeatMode.RepeatAll);
});

test('When toggleRepeatMode is is called, the repeatMode is toggled. More than one item in queue', () => {
  store.replaceState({
    ...defaultState(),
    queue: [DEMO_TEST_ITEM_A, DEMO_TEST_ITEM_B],
    repeatMode: RepeatMode.RepeatNone
  });

  store.dispatch('toggleRepeatMode');

  expect(store.state.repeatMode).toBe(RepeatMode.RepeatAll);

  store.dispatch('toggleRepeatMode');

  expect(store.state.repeatMode).toBe(RepeatMode.RepeatOne);

  store.dispatch('toggleRepeatMode');

  expect(store.state.repeatMode).toBe(RepeatMode.RepeatNone);
});

test('When toggleRepeatMode is is called, the repeatMode is toggled. One item in queue', () => {
  store.replaceState({
    ...defaultState(),
    queue: [DEMO_TEST_ITEM_A],
    repeatMode: RepeatMode.RepeatNone
  });

  store.dispatch('toggleRepeatMode');

  expect(store.state.repeatMode).toBe(RepeatMode.RepeatOne);

  store.dispatch('toggleRepeatMode');

  expect(store.state.repeatMode).toBe(RepeatMode.RepeatNone);
});
