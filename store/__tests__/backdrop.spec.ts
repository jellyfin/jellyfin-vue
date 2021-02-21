import Vue, { VueConstructor } from 'vue';
import { createLocalVue } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';
import { cloneDeep } from 'lodash';
import {
  state,
  mutations,
  actions,
  BackdropState,
  getters,
  defaultState
} from '../backdrop';

const BACKDROP_SET_TEST_VALUE = {
  blurhash: 'L7F$k?_*41GX^]KhTnJ8G?OXvz#;',
  opacity: 1
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

describe('vuex: backdrop', () => {
  it('sets the hash when "SET_CURRENT_BACKDROP" is committed', () => {
    store.replaceState({ ...defaultState() });

    store.commit('SET_CURRENT_BACKDROP', BACKDROP_TEST_MUTATION);

    expect(store.state.blurhash).toBe(BACKDROP_SET_TEST_VALUE.blurhash);
  });

  it('sets the opacity when "SET_BACKDROP_OPACITY" is committed', () => {
    store.replaceState({ ...defaultState() });

    store.commit('SET_BACKDROP_OPACITY', BACKDROP_TEST_MUTATION);

    expect(store.state.opacity).toBe(1);
  });

  it('clears the hash when "CLEAR_CURRENT_BACKDROP" is committed', () => {
    store.replaceState({ ...BACKDROP_SET_TEST_VALUE });

    store.commit('CLEAR_CURRENT_BACKDROP');

    expect(store.state.blurhash).toBe('');
  });

  it('resets the opacity when "RESET_BACKDROP_OPACITY" is committed', () => {
    store.replaceState({ ...BACKDROP_SET_TEST_VALUE });

    store.commit('RESET_BACKDROP_OPACITY');

    expect(store.state.opacity).toBe(0.75);
  });

  // Default case
  it('sets the hash when setBackdrop is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({ ...defaultState() });

    store.dispatch('setBackdrop', { hash: BACKDROP_TEST_MUTATION.newBlurhash });

    expect(store.state.blurhash).toBe(BACKDROP_TEST_MUTATION.newBlurhash);
  });
  // CASE B

  it('clears the hash when clearBackdrop is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({ ...BACKDROP_SET_TEST_VALUE });

    store.dispatch('clearBackdrop');

    expect(store.state.blurhash).toBe('');
  });

  it('sets the opacity when setBackdropOpacity is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({ ...defaultState() });

    store.dispatch('setBackdropOpacity', {
      newOpacity: BACKDROP_TEST_MUTATION.newOpacity
    });

    expect(store.state.opacity).toBe(BACKDROP_TEST_MUTATION.newOpacity);
  });

  it('resets the opacity when resetBackdropOpacity is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({ ...BACKDROP_SET_TEST_VALUE });

    store.dispatch('resetBackdropOpacity');

    expect(store.state.opacity).toBe(defaultState().opacity);
  });
});
