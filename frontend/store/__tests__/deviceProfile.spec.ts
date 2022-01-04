import Vuex, { ActionContext, Store } from 'vuex';
import cloneDeep from 'lodash/cloneDeep';
import { AppState } from '..';
import {
  state,
  mutations,
  actions,
  DeviceState,
  defaultState
} from '~/store/deviceProfile';
import { ModuleAction } from '~/jest-helpers.d';
import $browser from '~/mocks/browserPlugin';

const SET_DEVICE_PROFILE = {
  deviceId: 'test deviceId',
  deviceName: 'test deviceName',
  clientVersion: 'test clientVersion',
  clientName: 'test ClientName'
};

let store: Store<DeviceState>;
let mockCommit: jest.Mock;

beforeEach(() => {
  store = new Vuex.Store(cloneDeep({ state, mutations, actions }));

  mockCommit = jest.fn();
});

afterEach((): void => {
  mockCommit.mockReset();
});

describe('vuex: deviceProfile', () => {
  it('sets the device profile when "SET_PROFILE" is committed', () => {
    store.replaceState({ ...defaultState() });

    store.commit('SET_PROFILE', SET_DEVICE_PROFILE);

    expect(store.state).toMatchObject(SET_DEVICE_PROFILE);
  });

  it('clears the device profile when "CLEAR_PROFILE" is committed', () => {
    store.replaceState({ ...SET_DEVICE_PROFILE });

    store.commit('CLEAR_PROFILE');

    expect(store.state).toMatchObject(defaultState());
  });

  it('sets the device profile when setDeviceProfile is dispatched', () => {
    let setDeviceProfile =
      actions.setDeviceProfile as unknown as ModuleAction<DeviceState>;

    setDeviceProfile = setDeviceProfile.bind({ $browser });

    setDeviceProfile(
      { commit: mockCommit } as unknown as ActionContext<DeviceState, AppState>,
      {}
    );

    expect(mockCommit).toHaveBeenCalled();
    expect(mockCommit.mock.calls[0][0]).toBe('SET_PROFILE');
  });

  it('clears the device profile when clearDeviceProfile is dispatched', () => {
    let clearDeviceProfile =
      actions.clearDeviceProfile as unknown as ModuleAction<DeviceState>;

    clearDeviceProfile = clearDeviceProfile.bind({ $browser });

    clearDeviceProfile(
      { commit: mockCommit } as unknown as ActionContext<DeviceState, AppState>,
      {}
    );

    expect(mockCommit).toHaveBeenCalled();
    expect(mockCommit.mock.calls[0][0]).toBe('CLEAR_PROFILE');
  });
});
