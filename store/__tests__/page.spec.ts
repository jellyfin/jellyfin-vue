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

test('When "SET_PAGE_TITLE" is committed, the title is set.', () => {
  store.replaceState({ ...defaultState() });

  store.commit('SET_PAGE_TITLE', { title: PAGE_SET_TEST_VALUE.title });

  expect(store.state.title).toBe(PAGE_SET_TEST_VALUE.title);
});

test('When "SET_APPBAR_OPACITY" is committed, the opactity is set.', () => {
  store.replaceState({ ...defaultState() });

  store.commit('SET_APPBAR_OPACITY', {
    opaqueAppBar: PAGE_SET_TEST_VALUE.opaqueAppBar
  });

  expect(store.state.opaqueAppBar).toBe(PAGE_SET_TEST_VALUE.opaqueAppBar);
});

test('When "SET_NAVDRAWER_VISIBILITY" is committed, the navdrawer visibility is set.', () => {
  store.replaceState({ ...defaultState() });

  store.commit('SET_NAVDRAWER_VISIBILITY', {
    showNavDrawer: PAGE_SET_TEST_VALUE.showNavDrawer
  });

  expect(store.state.showNavDrawer).toBe(PAGE_SET_TEST_VALUE.showNavDrawer);
});

test('When "CLEAR_PAGE" is committed, the store is reset to defaults.', () => {
  store.replaceState({ ...PAGE_SET_TEST_VALUE });

  store.commit('CLEAR_PAGE');

  expect(store.state).toMatchObject(defaultState());
});

test('When setPageTitle is called, title is set.', () => {
  store.replaceState({ ...defaultState() });

  store.dispatch('setPageTitle', { title: PAGE_SET_TEST_VALUE.title });

  expect(store.state.title).toBe(PAGE_SET_TEST_VALUE.title);
});

test('When setAppBarOpacity is called, opacity is set.', () => {
  store.replaceState({ ...defaultState() });

  store.dispatch('setAppBarOpacity', {
    opaqueAppBar: PAGE_SET_TEST_VALUE.opaqueAppBar
  });

  expect(store.state.opaqueAppBar).toBe(PAGE_SET_TEST_VALUE.opaqueAppBar);
});

test('When showNavDrawer is called, showNavDrawer is set.', () => {
  store.replaceState({ ...defaultState() });

  store.dispatch('showNavDrawer', {
    showNavDrawer: PAGE_SET_TEST_VALUE.showNavDrawer
  });

  expect(store.state.showNavDrawer).toBe(PAGE_SET_TEST_VALUE.showNavDrawer);
});

test('When clearPage is called, store is set back to default.', () => {
  store.replaceState({ ...PAGE_SET_TEST_VALUE });

  store.dispatch('clearPage');

  expect(store.state).toMatchObject(defaultState());
});
