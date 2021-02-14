import Vue, { VueConstructor } from 'vue';
import { createLocalVue } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';
import { cloneDeep } from 'lodash';
import {
  state,
  mutations,
  actions,
  DeviceState,
  defaultState
} from '../deviceProfile';

const SET_DEVICE_PROFILE = {
  deviceId: 'test deviceId',
  deviceName: 'test deviceName',
  clientVersion: 'test clientVersion',
  clientName: 'test ClientName'
};

let localVue: VueConstructor<Vue>;
let store: Store<DeviceState>;

beforeEach(() => {
  localVue = createLocalVue();
  localVue.use(Vuex);

  store = new Vuex.Store(cloneDeep({ state, mutations, actions }));
});

describe('vuex: deviceProfile', () => {
  test('sets the device profile when "SET_PROFILE" is committed', () => {
    store.replaceState({ ...defaultState() });

    store.commit('SET_PROFILE', SET_DEVICE_PROFILE);

    expect(store.state).toMatchObject(SET_DEVICE_PROFILE);
  });

  test('clears the device profile when "CLEAR_PROFILE" is committed', () => {
    store.replaceState({ ...SET_DEVICE_PROFILE });

    store.commit('CLEAR_PROFILE');

    expect(store.state).toMatchObject(defaultState());
  });

  test('sets the device profile when setDeviceProfile is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    // Device profile may already be defined, this sets it to the default state
    store.replaceState({ ...defaultState() });

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

  test('clears the device profile when clearDeviceProfile is dispatched', () => {
    // TODO: This should only test if the proper mutation is committed
    // Set test values to be cleared
    store.replaceState({ ...SET_DEVICE_PROFILE });

    store.dispatch('clearDeviceProfile');

    expect(store.state).toMatchObject(defaultState());
  });
});
