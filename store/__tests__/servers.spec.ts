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

test('When "SET_SERVER_USED" is committed, server used is set.', () => {
  store.replaceState({ ...defaultState() });

  store.commit('SET_SERVER_USED', { ...DEMO_TEST_SERVER_VALUE });

  expect(store.state.serverUsed).toMatchObject(DEMO_TEST_SERVER_VALUE);
});

test('When "ADD_SERVER" is committed, the server is added to serverList', () => {
  store.replaceState({ ...defaultState() });

  store.commit('ADD_SERVER', {
    ...DEMO_TEST_SERVER_VALUE
  });

  expect(store.state.serverList[0]).toBeDefined();

  expect(store.state.serverList?.[0]).toMatchObject(DEMO_TEST_SERVER_VALUE);
});

test('When "REMOVE_SERVER" is committed, server with relevant id is removed from serverList', () => {
  store.replaceState({
    ...defaultState(),
    serverList: [DEMO_TEST_SERVER_VALUE]
  });

  store.commit('REMOVE_SERVER', DEMO_TEST_SERVER_VALUE.publicInfo.Id);

  expect(store.state.serverList).toHaveLength(0);
});

test('When "CLEAR_SERVERS" is committed, the store is cleared', () => {
  store.replaceState({
    serverUsed: DEMO_TEST_SERVER_VALUE,
    serverList: [DEMO_TEST_SERVER_VALUE]
  });

  store.commit('CLEAR_SERVERS');

  expect(store.state).toMatchObject({ ...defaultState() });
});

test('When addServer is called, server is added to serverList', () => {
  store.replaceState({
    ...defaultState()
  });

  store.dispatch('addServer', { ...DEMO_TEST_SERVER_VALUE });

  expect(store.state.serverList[0]).toBeDefined();

  expect(store.state.serverList?.[0]).toMatchObject(DEMO_TEST_SERVER_VALUE);
});

test('When removeServer is called, serverId is removed from serverList', () => {
  store.replaceState({
    ...defaultState(),
    serverList: [DEMO_TEST_SERVER_VALUE]
  });

  store.dispatch('removeServer', { ...DEMO_TEST_SERVER_VALUE });

  expect(store.state.serverList).toHaveLength(0);
});

test('When clearServers is called, the store is cleared', () => {
  store.replaceState({
    serverUsed: DEMO_TEST_SERVER_VALUE,
    serverList: [DEMO_TEST_SERVER_VALUE]
  });

  store.dispatch('clearServers');

  expect(store.state).toMatchObject({ ...defaultState() });
});
