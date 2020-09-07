import { Context } from '@nuxt/types';
import { v4 as uuidv4 } from 'uuid';
import { PluginInjection } from '~/types/utils';

interface DeviceProfile {
  set: () => void;
  clear: () => void;
}

declare module '@nuxt/types' {
  interface Context {
    $deviceProfile: DeviceProfile;
  }

  interface NuxtAppOptions {
    $deviceProfile: DeviceProfile;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $deviceProfile: DeviceProfile;
  }
}

declare module 'vuex/types/index' {
  interface Store<S> {
    $deviceProfile: DeviceProfile;
  }
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
 * @returns {string} deviceName returns the device's name
 */
function getDeviceName() {
  const userAgent = navigator.userAgent.toLowerCase();
  let deviceName = '';
  switch (true) {
    case userAgent.includes('edge'):
      deviceName = 'edge';
      break;
    case userAgent.includes('edg'):
      deviceName = 'chromium Edge';
      break;
    case userAgent.includes('opr'):
      deviceName = 'opera';
      break;
    case userAgent.includes('chrome'):
      deviceName = 'chrome';
      break;
    case userAgent.includes('ie'):
      deviceName = 'ie';
      break;
    case userAgent.includes('firefox'):
      deviceName = 'firefox';
      break;
    case userAgent.includes('safari'):
      deviceName = 'safari';
      break;
  }
  return deviceName;
}

/** Get's the current device's version
 *
 * @returns {string} clientVersion returns the current device version
 */
function getClientVersion(): string {
  return '0.0.0';
}

/** Get's the current device's name
 *
 * @returns {string} clienName returns the current client name
 */
function getClientName(): string {
  return 'Jellyfin Web (Vue)';
}

export default (context: Context, inject: PluginInjection): void => {
  const deviceProfile = {
    set: () => {
      context.store.commit('deviceProfile/set', {
        deviceId: getDeviceId(),
        deviceName: getDeviceName(),
        clientVersion: getClientVersion(),
        clientName: getClientName()
      });
    },
    clear: () => {
      context.store.commit('deviceProfile/clear');
    }
  };

  inject('deviceProfile', deviceProfile);
};
