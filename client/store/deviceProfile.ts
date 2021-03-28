import { ActionTree, MutationTree } from 'vuex';
import { v4 as uuidv4 } from 'uuid';
import { version } from '../../package.json';
import { BrowserDetector } from '~/plugins/browserDetection';

export interface DeviceState {
  deviceId: string;
  deviceName: string;
  clientVersion: string;
  clientName: string;
}

export const defaultState = (): DeviceState => ({
  deviceId: '',
  deviceName: '',
  clientVersion: '',
  clientName: ''
});

export const state = defaultState;

interface MutationPayload {
  deviceId: string;
  deviceName: string;
  clientVersion: string;
  clientName: string;
}

/** Generates a random string to be used for the deviceId
 *
 * @returns {string} deviceId returns a string encoded in base-64
 */
function getDeviceId(): string {
  return uuidv4();
}

/** Gets the device's name
 *
 * @param {BrowserDetector} $browser - Browser detection plugin
 * @returns {string} deviceName returns the device's name
 */
function getDeviceName($browser: BrowserDetector): string {
  let deviceName = 'Unknown';

  // TODO: Replace with pattern matching once TC39 adopts the proposal
  // See: https://github.com/tc39/proposal-pattern-matching
  if ($browser.isChrome()) {
    deviceName = 'Chrome';
  } else if ($browser.isEdge() && !$browser.isChromiumBased()) {
    deviceName = 'Edge (EdgeHTML)';
  } else if ($browser.isEdge()) {
    deviceName = 'Edge (Chromium)';
  } else if ($browser.isFirefox()) {
    deviceName = 'Firefox';
  } else if ($browser.isApple() && !$browser.isMobile()) {
    deviceName = 'Safari';
  } else if ($browser.isWebOS()) {
    deviceName = 'LG Smart TV';
  } else if ($browser.isTizen()) {
    deviceName = 'Samsung Smart TV';
  } else if ($browser.isApple() && $browser.isMobile()) {
    deviceName = 'iPhone';
  } else if ($browser.isAndroid()) {
    deviceName = 'Android';
  }

  return deviceName;
}

/** Get's the current device's version
 *
 * @returns {string} clientVersion returns the current device version
 */
function getClientVersion(): string {
  return version;
}

/** Get's the current device's name
 *
 * @returns {string} clienName returns the current client name
 */
function getClientName(): string {
  return 'Jellyfin Web (Vue)';
}

export const mutations: MutationTree<DeviceState> = {
  SET_PROFILE(state: DeviceState, payload: MutationPayload) {
    state.deviceId = payload.deviceId;
    state.deviceName = payload.deviceName;
    state.clientVersion = payload.clientVersion;
    state.clientName = payload.clientName;
  },
  CLEAR_PROFILE(state: DeviceState) {
    Object.assign(state, defaultState());
  }
};

export const actions: ActionTree<DeviceState, DeviceState> = {
  setDeviceProfile({ commit }) {
    commit('SET_PROFILE', {
      deviceId: getDeviceId(),
      deviceName: getDeviceName(this.$browser),
      clientVersion: getClientVersion(),
      clientName: getClientName()
    });
  },
  clearDeviceProfile({ commit }) {
    commit('CLEAR_PROFILE');
  }
};
