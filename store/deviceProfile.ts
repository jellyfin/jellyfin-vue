import { MutationTree } from 'vuex';

export interface deviceProfile {
  deviceId: string;
  deviceName: string;
  clientVersion: string;
  clientName: string;
}

export const state = (): deviceProfile => ({
  deviceId: '',
  deviceName: '',
  clientVersion: '',
  clientName: ''
});

interface MutationPayload {
  deviceId: string;
  deviceName: string;
  clientVersion: string;
  clientName: string;
}

export const mutations: MutationTree<deviceProfile> = {
  set(state: deviceProfile, payload: MutationPayload) {
    state.deviceId = payload.deviceId;
    state.deviceName = payload.deviceName;
    state.clientVersion = payload.clientVersion;
    state.clientName = payload.clientName;
  },
  clear(state: deviceProfile) {
    state.deviceId = '';
    state.deviceName = '';
    state.clientVersion = '';
    state.clientName = '';
  }
};
