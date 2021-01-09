import Vue, { VueConstructor } from 'vue';
import { createLocalVue } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';
import { cloneDeep } from 'lodash';
import { state, mutations, actions, DeviceState } from '../deviceProfile';

const SET_DEVICE_PROFILE = {
  deviceId: 'test deviceId',
  deviceName: 'test deviceName',
  clientVersion: 'test clientVersion',
  clientName: 'test ClientName'
};

const DEVICE_PROFILE_CLEAR_TEST_VALUE = {
  deviceId: '',
  deviceName: '',
  clientVersion: '',
  clientName: ''
};

let localVue: VueConstructor<Vue>;
let store: Store<DeviceState>;

beforeEach(() => {
  localVue = createLocalVue();
  localVue.use(Vuex);

  store = new Vuex.Store(cloneDeep({ state, mutations, actions }));
});

test('When "SET_PROFILE" is committed, the deviceProfile is set.', () => {
  store.replaceState({ ...DEVICE_PROFILE_CLEAR_TEST_VALUE });

  store.commit('SET_PROFILE', SET_DEVICE_PROFILE);

  expect(store.state).toMatchObject(SET_DEVICE_PROFILE);
});

test('When "CLEAR_PROFILE" is committed, the deviceProfile is cleared.', () => {
  store.replaceState({ ...SET_DEVICE_PROFILE });

  store.commit('CLEAR_PROFILE');

  expect(store.state).toMatchObject(DEVICE_PROFILE_CLEAR_TEST_VALUE);
});

test('When setDeviceProfile is called, device profile is set.', () => {
  // Device profile may already be defined, this sets it to the default state
  store.replaceState({ ...DEVICE_PROFILE_CLEAR_TEST_VALUE });

  store.dispatch('setDeviceProfile');

  expect(typeof store.state.deviceId).toBe('string');
  expect(store.state.deviceId.length).toBeGreaterThan(1);

  expect(typeof store.state.deviceName).toBe('string');
  expect(store.state.deviceName.length).toBeGreaterThan(1);

  expect(typeof store.state.clientName).toBe('string');
  expect(store.state.clientName.length).toBeGreaterThan(1);

  expect(typeof store.state.clientVersion).toBe('string');
  expect(store.state.clientVersion.length).toBeGreaterThan(1);
});

test('When clearDeviceProfile is called, device profile is cleared.', () => {
  // Set test values to be cleared
  store.replaceState({ ...SET_DEVICE_PROFILE });

  store.dispatch('clearDeviceProfile');

  expect(store.state).toMatchObject(DEVICE_PROFILE_CLEAR_TEST_VALUE);
});
