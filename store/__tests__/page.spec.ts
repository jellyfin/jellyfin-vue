import Vue, { VueConstructor } from 'vue';
import { createLocalVue } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';
import { cloneDeep } from 'lodash';
import { state, mutations, actions, PageState } from '../page';

const PAGE_SET_TEST_VALUE = {
  title: 'Test Title',
  opaqueAppBar: false
};

const PAGE_CLEAR_TEST_VALUE = {
  title: '',
  opaqueAppBar: true
};

let localVue: VueConstructor<Vue>;
let store: Store<PageState>;

beforeEach(() => {
  localVue = createLocalVue();
  localVue.use(Vuex);

  store = new Vuex.Store(cloneDeep({ state, mutations, actions }));
});

test('When "SET_PAGE_TITLE" is committed, the title is set.', () => {
  store.replaceState({ ...PAGE_CLEAR_TEST_VALUE });

  store.commit('SET_PAGE_TITLE', { title: PAGE_SET_TEST_VALUE.title });

  expect(store.state.title).toBe(PAGE_SET_TEST_VALUE.title);
});

test('When "SET_APPBAR_OPACITY" is committed, the opactity is set.', () => {
  store.replaceState({ ...PAGE_CLEAR_TEST_VALUE });

  store.commit('SET_APPBAR_OPACITY', {
    opaqueAppBar: PAGE_SET_TEST_VALUE.opaqueAppBar
  });

  expect(store.state.opaqueAppBar).toBe(PAGE_SET_TEST_VALUE.opaqueAppBar);
});

test('When setPageTitle is called, title is set.', () => {
  store.replaceState({ ...PAGE_CLEAR_TEST_VALUE });

  store.dispatch('setPageTitle', { title: PAGE_SET_TEST_VALUE.title });

  expect(store.state.title).toBe(PAGE_SET_TEST_VALUE.title);
});

test('When setAppBarOpacity is called, opacity is set.', () => {
  store.replaceState({ ...PAGE_CLEAR_TEST_VALUE });

  store.dispatch('setAppBarOpacity', {
    opaqueAppBar: PAGE_SET_TEST_VALUE.opaqueAppBar
  });

  expect(store.state.opaqueAppBar).toBe(PAGE_SET_TEST_VALUE.opaqueAppBar);
});
