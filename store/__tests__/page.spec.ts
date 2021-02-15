import Vue, { VueConstructor } from 'vue';
import { createLocalVue } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';
import { cloneDeep } from 'lodash';
import { state, mutations, actions, PageState, defaultState } from '../page';

const PAGE_SET_TEST_VALUE = {
  title: 'Test Title',
  opaqueAppBar: false,
  showNavDrawer: false
};

let localVue: VueConstructor<Vue>;
let store: Store<PageState>;

beforeEach(() => {
  localVue = createLocalVue();
  localVue.use(Vuex);

  store = new Vuex.Store(cloneDeep({ state, mutations, actions }));
});

describe('vuex: page', () => {
  test('sets the title when "SET_PAGE_TITLE" is committed', () => {
    store.replaceState({ ...defaultState() });

    store.commit('SET_PAGE_TITLE', { title: PAGE_SET_TEST_VALUE.title });

    expect(store.state.title).toBe(PAGE_SET_TEST_VALUE.title);
  });

  test('sets the app bar opacity when "SET_APPBAR_OPACITY" is committed', () => {
    store.replaceState({ ...defaultState() });

    store.commit('SET_APPBAR_OPACITY', {
      opaqueAppBar: PAGE_SET_TEST_VALUE.opaqueAppBar
    });

    expect(store.state.opaqueAppBar).toBe(PAGE_SET_TEST_VALUE.opaqueAppBar);
  });

  test('sets the navigation drawer visibility when "SET_NAVDRAWER_VISIBILITY" is committed', () => {
    store.replaceState({ ...defaultState() });

    store.commit('SET_NAVDRAWER_VISIBILITY', {
      showNavDrawer: PAGE_SET_TEST_VALUE.showNavDrawer
    });

    expect(store.state.showNavDrawer).toBe(PAGE_SET_TEST_VALUE.showNavDrawer);
  });

  test('resets the state when "CLEAR_PAGE" is committed', () => {
    store.replaceState({ ...PAGE_SET_TEST_VALUE });

    store.commit('CLEAR_PAGE');

    expect(store.state).toMatchObject(defaultState());
  });

  test('sets the title when setPageTitle is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({ ...defaultState() });

    store.dispatch('setPageTitle', { title: PAGE_SET_TEST_VALUE.title });

    expect(store.state.title).toBe(PAGE_SET_TEST_VALUE.title);
  });

  test('sets the app bar opacity when setAppBarOpacity is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({ ...defaultState() });

    store.dispatch('setAppBarOpacity', {
      opaqueAppBar: PAGE_SET_TEST_VALUE.opaqueAppBar
    });

    expect(store.state.opaqueAppBar).toBe(PAGE_SET_TEST_VALUE.opaqueAppBar);
  });

  test('sets the navigation drawer visibility when showNavDrawer is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({ ...defaultState() });

    store.dispatch('showNavDrawer', {
      showNavDrawer: PAGE_SET_TEST_VALUE.showNavDrawer
    });

    expect(store.state.showNavDrawer).toBe(PAGE_SET_TEST_VALUE.showNavDrawer);
  });

  test('resets the state when clearPage is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({ ...PAGE_SET_TEST_VALUE });

    store.dispatch('clearPage');

    expect(store.state).toMatchObject(defaultState());
  });
});
