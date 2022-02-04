import Vue, { VueConstructor } from 'vue';
import { createLocalVue } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';
import cloneDeep from 'lodash/cloneDeep';
import {
  state,
  mutations,
  actions,
  SnackbarState,
  defaultState
} from '../snackbar';

const SNACKBAR_SET_TEST_VALUE = {
  message: 'Test Message',
  color: 'Test Color'
};

let localVue: VueConstructor<Vue>;
let store: Store<SnackbarState>;

beforeEach(() => {
  localVue = createLocalVue();
  localVue.use(Vuex);

  store = new Vuex.Store(cloneDeep({ state, mutations, actions }));
});

describe('vuex: snackbar', () => {
  it('sets the snackbar message when "SET_SNACKBAR_MESSAGE" is committed', () => {
    store.replaceState({ ...defaultState() });

    store.commit('SET_SNACKBAR_MESSAGE', SNACKBAR_SET_TEST_VALUE);

    expect(store.state).toMatchObject(SNACKBAR_SET_TEST_VALUE);
  });

  it('resets the snackbar message when "RESET_MESSAGE" is committed', () => {
    store.replaceState({ ...SNACKBAR_SET_TEST_VALUE });

    store.commit('RESET_MESSAGE');

    expect(store.state).toMatchObject(defaultState());
  });

  it('sets the snackbar message and color when pushSnackbarMessage is dispatched with a color', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({ ...defaultState() });

    store.dispatch('pushSnackbarMessage', SNACKBAR_SET_TEST_VALUE);

    expect(store.state).toMatchObject(SNACKBAR_SET_TEST_VALUE);
  });

  // Undefined color is '' when color is not passed
  it('sets the snackbar message and no color when pushSnackbarMessage is dispatched without a color', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({ ...defaultState() });

    store.dispatch('pushSnackbarMessage', {
      ...SNACKBAR_SET_TEST_VALUE,
      color: undefined
    });

    expect(store.state).toMatchObject({
      ...SNACKBAR_SET_TEST_VALUE,
      color: ''
    });
  });

  it('clears the snackbar message when resetMessage is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({ ...SNACKBAR_SET_TEST_VALUE });

    store.dispatch('resetMessage');

    expect(store.state).toMatchObject(defaultState());
  });
});
