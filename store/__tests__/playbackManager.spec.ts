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

describe('vuex: playbackManager', () => {
  it('returns the currently playing item when getCurrentItem is called', () => {
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

  it('returns null when getPreviousItem is called with no last item index set', () => {
    store.replaceState({
      ...defaultState(),
      queue: [DEMO_TEST_ITEM_A, DEMO_TEST_ITEM_B, DEMO_TEST_ITEM_C],
      currentItemIndex: 0
    });

    expect(store.getters.getPreviousItem).toBeNull();
  });

  it('returns null when getPreviousItem is called with a last item index set that is not in the queue', () => {
    store.replaceState({
      ...defaultState(),
      queue: [DEMO_TEST_ITEM_A, DEMO_TEST_ITEM_B, DEMO_TEST_ITEM_C],
      currentItemIndex: 1,
      lastItemIndex: 3
    });

    expect(store.getters.getPreviousItem).toBeNull();
  });

  it('returns the previous item when getPreviousItem is called with a last item index set that exists in the queue', () => {
    store.replaceState({
      ...defaultState(),
      queue: [DEMO_TEST_ITEM_A, DEMO_TEST_ITEM_B, DEMO_TEST_ITEM_C],
      currentItemIndex: 1,
      lastItemIndex: 0
    });

    expect(store.getters.getPreviousItem).toMatchObject(DEMO_TEST_ITEM_A);
  });

  it('returns the next item when getNextItem is called', () => {
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

  it("returns the current item's type when getCurrentlyPlayingType is called", () => {
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

  it("returns the current item's media type when getCurrentlyPlayingMediaType is called", () => {
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

  it('sets the queue when "SET_QUEUE" is committed with an empty queue', () => {
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

  it('adds a list of items to the queue when "ADD_TO_QUEUE" is committed with an empty queue', () => {
    store.replaceState({
      ...defaultState()
    });

    store.commit('ADD_TO_QUEUE', {
      queue: [DEMO_TEST_ITEM_B, DEMO_TEST_ITEM_A]
    });

    expect(store.state.queue).toMatchObject([
      DEMO_TEST_ITEM_B,
      DEMO_TEST_ITEM_A
    ]);
  });

  it('adds a duplicate item at the end of the queue when "ADD_TO_QUEUE" is committed with an item already in the queue', () => {
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

  it('adds a new item at the end of the queue when "ADD_TO_QUEUE" is committed with an item already in the queue', () => {
    store.replaceState({
      ...defaultState(),
      queue: [DEMO_TEST_ITEM_A, DEMO_TEST_ITEM_B]
    });

    store.commit('ADD_TO_QUEUE', {
      queue: [DEMO_TEST_ITEM_C]
    });

    expect(store.state.queue).toMatchObject([
      DEMO_TEST_ITEM_A,
      DEMO_TEST_ITEM_B,
      DEMO_TEST_ITEM_C
    ]);
  });

  it('clears the queue when "CLEAR_QUEUE" is committed', () => {
    store.replaceState({
      ...defaultState(),
      queue: [DEMO_TEST_ITEM_A, DEMO_TEST_ITEM_B]
    });

    store.commit('CLEAR_QUEUE');

    expect(store.state.queue).toMatchObject(defaultState().queue);
  });

  it('sets the current and last indexes when "SET_CURRENT_ITEM_INDEX" is committed', () => {
    store.replaceState({
      ...defaultState(),
      queue: [
        DEMO_TEST_ITEM_A,
        DEMO_TEST_ITEM_B,
        DEMO_TEST_ITEM_C,
        DEMO_TEST_ITEM_A
      ],
      currentItemIndex: 1
    });

    store.commit('SET_CURRENT_ITEM_INDEX', { currentItemIndex: 3 });

    expect(store.state.lastItemIndex).toBe(1);
    expect(store.state.currentItemIndex).toBe(3);
  });

  it('sets the current media source when "SET_CURRENT_MEDIA_SOURCE" is committed', () => {
    store.replaceState({
      ...defaultState()
    });

    store.commit('SET_CURRENT_MEDIA_SOURCE', {
      mediaSource: DEMO_TEST_MEDIA_SOURCE
    });

    expect(store.state.currentMediaSource).toMatchObject(
      DEMO_TEST_MEDIA_SOURCE
    );
  });

  it('does not increase the current item index when "INCREASE_QUEUE_INDEX" is committed when the current index is null', () => {
    store.replaceState({
      ...defaultState()
    });

    store.commit('INCREASE_QUEUE_INDEX');

    expect(store.state.currentItemIndex).toBeNull();
  });

  it('increases the current and last item indexes when "INCREASE_QUEUE_INDEX" is committed when the current index is a number', () => {
    // TODO: This should ensure that we can't reach an out of bounds index
    store.replaceState({
      ...defaultState(),
      currentItemIndex: 1,
      lastItemIndex: 0,
      currentTime: 100
    });

    store.commit('INCREASE_QUEUE_INDEX');

    expect(store.state.currentItemIndex).toBe(2);
    expect(store.state.lastItemIndex).toBe(1);
    expect(store.state.currentTime).toBe(0);
  });

  it('does not decrease the current item index when "DECREASE_QUEUE_INDEX" is committed when the current index is null', () => {
    store.replaceState({
      ...defaultState()
    });

    store.commit('DECREASE_QUEUE_INDEX');

    expect(store.state.currentItemIndex).toBeNull();
  });

  it('decreases the current and last item indexes when "DECREASE_QUEUE_INDEX" is committed when the current index is a number', () => {
    // TODO: This should ensure that we can't reach an out of bounds index
    store.replaceState({
      ...defaultState(),
      currentItemIndex: 2,
      currentTime: 1
    });

    store.commit('DECREASE_QUEUE_INDEX');

    expect(store.state.currentItemIndex).toBe(1);
    expect(store.state.currentTime).toBe(0);
  });

  it('sets the playback status to playing when "START_PLAYBACK" is committed', () => {
    // TODO: This should ensure that setting playing on an empty queue can't happen
    store.replaceState({
      ...defaultState()
    });

    store.commit('START_PLAYBACK', { initMode: InitMode.Unknown });

    expect(store.state.status).toBe(PlaybackStatus.playing);
  });

  it('sets the playback status to playing when "UNPAUSE_PLAYBACK" is committed', () => {
    // TODO: This should ensure that setting playing on an empty queue can't happen
    store.replaceState({
      ...defaultState()
    });

    store.commit('UNPAUSE_PLAYBACK');

    expect(store.state.status).toBe(PlaybackStatus.playing);
  });

  it('sets the playback status to paused when "PAUSE_PLAYBACK" is committed', () => {
    store.replaceState({
      ...defaultState(),
      status: PlaybackStatus.playing
    });

    store.commit('PAUSE_PLAYBACK');

    expect(store.state.status).toBe(PlaybackStatus.paused);
  });

  it('clears the playback status when "STOP_PLAYBACK" is committed', () => {
    store.replaceState({
      ...defaultState(),
      status: PlaybackStatus.playing
    });

    store.commit('STOP_PLAYBACK');

    expect(store.state).toMatchObject(defaultState());
  });

  it('clears the last item index when "RESET_LAST_ITEM_INDEX" is committed', () => {
    store.replaceState({
      ...defaultState(),
      lastItemIndex: 10
    });

    store.commit('RESET_LAST_ITEM_INDEX');

    expect(store.state.lastItemIndex).toBeNull();
  });

  it('sets the volume when "SET_VOLUME" is committed', () => {
    store.replaceState({
      ...defaultState()
    });

    store.commit('SET_VOLUME', { volume: 10 });

    expect(store.state.currentVolume).toBe(10);
  });

  it('sets the players to minimized when "SET_MINIMIZE" is committed with true', () => {
    store.replaceState({
      ...defaultState(),
      isMinimized: false
    });

    store.commit('SET_MINIMIZE', { minimized: true });

    expect(store.state.isMinimized).toBe(true);
  });

  it('sets the players to maximized when "SET_MINIMIZE" is committed with false', () => {
    store.replaceState({
      ...defaultState(),
      isMinimized: true
    });

    store.commit('SET_MINIMIZE', { minimized: false });

    expect(store.state.isMinimized).toBe(false);
  });

  it('sets the current time when "SET_CURRENT_TIME" is committed', () => {
    store.replaceState({
      ...defaultState()
    });

    store.commit('SET_CURRENT_TIME', { time: 1.234 });

    expect(store.state.currentTime).toBe(1.234);
  });

  it('sets the current time when "CHANGE_CURRENT_TIME" is committed', () => {
    // TODO: It seems a bit idiotic to have two mutations for the same thing, that are always called together. Look into refactoring this.
    store.replaceState({
      ...defaultState()
    });

    store.commit('CHANGE_CURRENT_TIME', { time: 1.234 });

    expect(store.state.currentTime).toBe(1.234);
  });

  it('toggles the minimized player flag when "TOGGLE_MINIMIZE" is committed', () => {
    store.replaceState({
      ...defaultState(),
      isMinimized: false
    });

    store.commit('TOGGLE_MINIMIZE');

    expect(store.state.isMinimized).toBe(true);

    store.commit('TOGGLE_MINIMIZE');

    expect(store.state.isMinimized).toBe(false);
  });

  it('sets the play session ID when "SET_PLAY_SESSION_ID" is committed', () => {
    store.replaceState({
      ...defaultState()
    });

    store.commit('SET_PLAY_SESSION_ID', { id: 'demo-play-session-id' });

    expect(store.state.playSessionId).toBe('demo-play-session-id');
  });

  it('sets the playback status to stopped when stop is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({
      ...defaultState(),
      status: PlaybackStatus.playing
    });

    store.dispatch('stop');

    expect(store.state.status).toBe(PlaybackStatus.stopped);
  });

  it('sets the playback status to paused when pause is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({
      ...defaultState(),
      status: PlaybackStatus.playing
    });

    store.dispatch('pause');

    expect(store.state.status).toBe(PlaybackStatus.paused);
  });

  it('sets the playback status to playing when unpause is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({
      ...defaultState(),
      status: PlaybackStatus.paused
    });

    store.dispatch('unpause');

    expect(store.state.status).toBe(PlaybackStatus.playing);
  });

  it('toggles the playback status when playPause is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({
      ...defaultState(),
      status: PlaybackStatus.paused
    });

    store.dispatch('playPause');

    expect(store.state.status).toBe(PlaybackStatus.playing);

    store.dispatch('playPause');

    expect(store.state.status).toBe(PlaybackStatus.paused);
  });

  it('clears the queue when clearQueue is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({
      ...defaultState(),
      queue: [DEMO_TEST_ITEM_A, DEMO_TEST_ITEM_B]
    });

    store.dispatch('clearQueue');

    expect(store.state.queue).toMatchObject(defaultState().queue);
  });

  it('sets the media source when setMediaSource is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({
      ...defaultState()
    });

    store.dispatch('setMediaSource', { mediaSource: DEMO_TEST_MEDIA_SOURCE });

    expect(store.state.currentMediaSource).toMatchObject(
      DEMO_TEST_MEDIA_SOURCE
    );
  });

  it('clears the queue when setNextTrack is dispatched at the end of the queue', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({
      ...defaultState(),
      queue: [DEMO_TEST_ITEM_A, DEMO_TEST_ITEM_B],
      status: PlaybackStatus.playing,
      currentItemIndex: 1
    });

    store.dispatch('setNextTrack');

    expect(store.state.status).toBe(PlaybackStatus.stopped);
  });

  it('increases the item indexes when setNextTrack is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({
      ...defaultState(),
      queue: [DEMO_TEST_ITEM_A, DEMO_TEST_ITEM_B],
      currentItemIndex: 0
    });

    store.dispatch('setNextTrack');

    expect(store.state.currentItemIndex).toBe(1);
    expect(store.state.lastItemIndex).toBe(0);
  });

  it('clears the current time when setPreviousTrack is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({
      ...defaultState(),
      currentTime: 5
    });

    store.dispatch('setPreviousTrack');

    expect(store.state.currentTime).toBe(0);
  });

  it('decreases the item indexs when setPreviousTrack is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({
      ...defaultState(),
      currentItemIndex: 3
    });

    store.dispatch('setPreviousTrack');

    expect(store.state.currentItemIndex).toBe(2);
    expect(store.state.lastItemIndex).toBe(3);
  });

  it('clears the current time when resetCurrentTime is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({
      ...defaultState(),
      currentTime: 1.234
    });

    store.dispatch('resetCurrentTime');

    expect(store.state.currentTime).toBe(0);
  });

  it('clears the current item index when resetCurrentItemIndex is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({
      ...defaultState(),
      currentItemIndex: 1
    });

    store.dispatch('resetCurrentItemIndex');

    expect(store.state.currentItemIndex).toBeNull();
  });

  it('sets the last item index to the current item index when setLastItemIndex is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({
      ...defaultState(),
      lastItemIndex: 1,
      currentItemIndex: 2
    });

    store.dispatch('setLastItemIndex');

    expect(store.state.lastItemIndex).toBe(2);
  });

  it('clears the last item index when resetLastItemIndex is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({
      ...defaultState(),
      lastItemIndex: 1
    });

    store.dispatch('resetLastItemIndex');

    expect(store.state.lastItemIndex).toBeNull();
  });

  it('sets the last progress update when setLastProgressUpdate is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({
      ...defaultState()
    });

    store.dispatch('setLastProgressUpdate', { progress: 10 });

    expect(store.state.lastProgressUpdate).toBe(10);
  });

  it('sets the current volume when setVolume is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({
      ...defaultState()
    });

    store.dispatch('setVolume', { volume: 10 });

    expect(store.state.currentVolume).toBe(10);
  });

  it('sets the current item index when setCurrentIndex is dispatched with the same index', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({
      ...defaultState(),
      currentItemIndex: 5
    });

    store.dispatch('setCurrentIndex', { index: 5 });

    expect(store.state.currentItemIndex).toBe(5);
  });

  it('sets the current item index when setCurrentIndex is dispatched with a new index', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({
      ...defaultState(),
      currentItemIndex: 5
    });

    store.dispatch('setCurrentIndex', { index: 6 });

    expect(store.state.currentItemIndex).toBe(6);
  });

  it('sets the current time when when setCurrentTime is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({
      ...defaultState()
    });

    store.dispatch('setCurrentTime', { time: 12.345 });

    expect(store.state.currentTime).toBe(12.345);
  });

  it('sets the current time when when changeCurrentTime is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({
      ...defaultState()
    });

    store.dispatch('changeCurrentTime', { time: 12.345 });

    expect(store.state.currentTime).toBe(12.345);
  });

  it('updates the current time when skipForward is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({
      ...defaultState(),
      currentTime: 10
    });

    store.dispatch('skipForward');

    expect(store.state.currentTime).toBe(25);
  });

  it('resets the current time when skipBackward is dispatched when at 10 seconds or less', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({
      ...defaultState(),
      currentTime: 10
    });

    store.dispatch('skipBackward');

    expect(store.state.currentTime).toBe(0);
  });

  it('sets the current time when skipBackward is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({
      ...defaultState(),
      currentTime: 25
    });

    store.dispatch('skipBackward');

    expect(store.state.currentTime).toBe(10);
  });

  it('updates the minimized flag when setMinimized is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({
      ...defaultState(),
      isMinimized: false
    });

    store.dispatch('setMinimized', { minimized: true });

    expect(store.state.isMinimized).toBe(true);
  });

  it('updates the minimized flag when toggleMinimized is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({
      ...defaultState(),
      isMinimized: false
    });

    store.dispatch('toggleMinimized');

    expect(store.state.isMinimized).toBe(true);

    store.dispatch('toggleMinimized');

    expect(store.state.isMinimized).toBe(false);
  });

  it('sets the play session ID when setPlaySessionId is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({
      ...defaultState()
    });

    store.dispatch('setPlaySessionId', { id: 'demo-play-session-id' });

    expect(store.state.playSessionId).toBe('demo-play-session-id');
  });

  it('sets the repeat mode when setRepeatMode is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({
      ...defaultState()
    });

    store.dispatch('setRepeatMode', { mode: RepeatMode.RepeatAll });

    expect(store.state.repeatMode).toBe(RepeatMode.RepeatAll);
  });

  it('toggles between RepeatAll, RepeatOne and RepeatNone when toggleRepeatMode is dispatched with multiple items in the queue', () => {
    // TODO: This should only test if the proper mutation is committed
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

  it('toggles between RepeatOne and RepeatNone when toggleRepeatMode is dispatched with one item in the queue', () => {
    // TODO: This should only test if the proper mutation is committed
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
});
