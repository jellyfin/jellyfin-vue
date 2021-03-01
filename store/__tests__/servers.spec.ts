import Vue, { VueConstructor } from 'vue';
import { createLocalVue } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';
import { cloneDeep } from 'lodash';
import {
  state,
  mutations,
  actions,
  ServerState,
  defaultState
} from '../servers';

const DEMO_TEST_SERVER_VALUE = {
  address: 'https://demo.jellyfin.org/unstable',
  publicInfo: {
    Id: 'c105d2cc63214e35a137c708e69afac9',
    LocalAddress: 'Demo Local Address',
    OperatingSystem: 'Linux',
    ProductName: 'Jellyfin Server',
    ServerName: 'Unstable Demo',
    StartupWizardCompleted: true,
    Version: '10.7.0'
  }
};

let localVue: VueConstructor<Vue>;
let store: Store<ServerState>;

beforeEach(() => {
  localVue = createLocalVue();
  localVue.use(Vuex);

  store = new Vuex.Store(cloneDeep({ state, mutations, actions }));
});

describe('vuex: servers', () => {
  it('sets the used server when "SET_SERVER_USED" is committed', () => {
    store.replaceState({ ...defaultState() });

    store.commit('SET_SERVER_USED', { ...DEMO_TEST_SERVER_VALUE });

    expect(store.state.serverUsed).toMatchObject(DEMO_TEST_SERVER_VALUE);
  });

  it('adds the server to the server list when "ADD_SERVER" is committed', () => {
    store.replaceState({ ...defaultState() });

    store.commit('ADD_SERVER', {
      ...DEMO_TEST_SERVER_VALUE
    });

    expect(store.state.serverList[0]).toBeDefined();

    expect(store.state.serverList?.[0]).toMatchObject(DEMO_TEST_SERVER_VALUE);
  });

  it('removes the server from the server list when "REMOVE_SERVER" is committed', () => {
    store.replaceState({
      ...defaultState(),
      serverList: [DEMO_TEST_SERVER_VALUE]
    });

    store.commit('REMOVE_SERVER', DEMO_TEST_SERVER_VALUE.publicInfo.Id);

    expect(store.state.serverList).toHaveLength(0);
  });

  it('clears the store when "CLEAR_SERVERS" is committed', () => {
    store.replaceState({
      serverUsed: DEMO_TEST_SERVER_VALUE,
      serverList: [DEMO_TEST_SERVER_VALUE]
    });

    store.commit('CLEAR_SERVERS');

    expect(store.state).toMatchObject({ ...defaultState() });
  });

  it('adds a server to the server list when addServer is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({
      ...defaultState()
    });

    store.dispatch('addServer', { ...DEMO_TEST_SERVER_VALUE });

    expect(store.state.serverList[0]).toBeDefined();

    expect(store.state.serverList[0]).toMatchObject(DEMO_TEST_SERVER_VALUE);
  });

  it('removes a server from the server list when removeServer is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({
      ...defaultState(),
      serverList: [DEMO_TEST_SERVER_VALUE]
    });

    store.dispatch('removeServer', { ...DEMO_TEST_SERVER_VALUE });

    expect(store.state.serverList).toHaveLength(0);
  });

  it('clears the store when clearServers is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    store.replaceState({
      serverUsed: DEMO_TEST_SERVER_VALUE,
      serverList: [DEMO_TEST_SERVER_VALUE]
    });

    store.dispatch('clearServers');

    expect(store.state).toMatchObject({ ...defaultState() });
  });
});
