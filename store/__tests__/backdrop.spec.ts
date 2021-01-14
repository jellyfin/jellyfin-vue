import Vue, { VueConstructor } from 'vue';
import { createLocalVue } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';
import { cloneDeep } from 'lodash';
import { state, mutations, actions, BackdropState, getters } from '../backdrop';

const BACKDROP_SET_TEST_VALUE = {
  blurhash: 'L7F$k?_*41GX^]KhTnJ8G?OXvz#;',
  opacity: 1
};

const BACKDROP_CLEAR_TEST_VALUE: BackdropState = {
  blurhash: '',
  opacity: 0.75
};

const BACKDROP_TEST_MUTATION = {
  newBlurhash: 'L7F$k?_*41GX^]KhTnJ8G?OXvz#;',
  newOpacity: 1
};

let localVue: VueConstructor<Vue>;
let store: Store<BackdropState>;

beforeEach(() => {
  localVue = createLocalVue();
  localVue.use(Vuex);

  store = new Vuex.Store(cloneDeep({ state, mutations, actions, getters }));
});

test('When "SET_CURRENT_BACKDROP" is committed, the hash value is set.', () => {
  store.replaceState({ ...BACKDROP_CLEAR_TEST_VALUE });

  store.commit('SET_CURRENT_BACKDROP', BACKDROP_TEST_MUTATION);

  expect(store.state.blurhash).toBe(BACKDROP_SET_TEST_VALUE.blurhash);
});

test('When "SET_BACKDROP_OPACITY" is committed, the hash value is set.', () => {
  store.replaceState({ ...BACKDROP_CLEAR_TEST_VALUE });

  store.commit('SET_BACKDROP_OPACITY', BACKDROP_TEST_MUTATION);

  expect(store.state.opacity).toBe(1);
});

test('When "CLEAR_CURRENT_BACKDROP" is committed, the hash value is cleared.', () => {
  store.replaceState({ ...BACKDROP_SET_TEST_VALUE });

  store.commit('CLEAR_CURRENT_BACKDROP');

  expect(store.state.blurhash).toBe('');
});

test('When "RESET_BACKDROP_OPACITY" is committed, the opacity is set to 0.75.', () => {
  store.replaceState({ ...BACKDROP_SET_TEST_VALUE });

  store.commit('RESET_BACKDROP_OPACITY');

  expect(store.state.opacity).toBe(0.75);
});

// Default case
test('When setBackdrop is called, the has is set. Case A', () => {
  store.replaceState({ ...BACKDROP_CLEAR_TEST_VALUE });

  store.dispatch('setBackdrop', { hash: BACKDROP_TEST_MUTATION.newBlurhash });

  expect(store.state.blurhash).toBe(BACKDROP_TEST_MUTATION.newBlurhash);
});
// CASE B

test('When clearBackdrop is called, the hash value is cleared.', () => {
  store.replaceState({ ...BACKDROP_SET_TEST_VALUE });

  store.dispatch('clearBackdrop');

  expect(store.state.blurhash).toBe('');
});

test('When setBackdropOpacity is called, the opacity value is set.', () => {
  store.replaceState({ ...BACKDROP_CLEAR_TEST_VALUE });

  store.dispatch('setBackdropOpacity', {
    newOpacity: BACKDROP_TEST_MUTATION.newOpacity
  });

  expect(store.state.opacity).toBe(BACKDROP_TEST_MUTATION.newOpacity);
});

test('When resetBackdropOpacity is called, the opacity value is cleared.', () => {
  store.replaceState({ ...BACKDROP_SET_TEST_VALUE });

  store.dispatch('resetBackdropOpacity');

  expect(store.state.opacity).toBe(BACKDROP_CLEAR_TEST_VALUE.opacity);
});
