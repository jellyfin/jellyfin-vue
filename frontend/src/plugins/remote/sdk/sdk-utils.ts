import { type Api, Jellyfin } from '@jellyfin/sdk';
import { v4 } from 'uuid';
import {
  isAndroid,
  isApple,
  isChrome,
  isChromiumBased,
  isEdge,
  isFirefox,
  isMobile,
  isTizen,
  isWebOS
} from '@/utils/browser-detection';
import { version } from '@/../package.json';

/**
 * Returns the device ID, creating it in case it does not exist
 */
function ensureDeviceId(): string {
  const storageKey = 'deviceId';
  const val = globalThis.localStorage.getItem(storageKey);

  if (!val) {
    const id = v4();

    globalThis.localStorage.setItem(storageKey, id);

    return id;
  }

  return val;
}

const SDK = new Jellyfin({
  clientInfo: {
    name: 'Jellyfin Web (Vue)',
    version: version
  },
  deviceInfo: {
    name: getDeviceName(),
    id: ensureDeviceId()
  }
});

/**
 * Gets the device's name based on the browser's user agent.
 */
function getDeviceName(): string {
  let deviceName = 'Unknown';

  if (isChrome()) {
    deviceName = 'Chrome';
  } else if (isEdge() && !isChromiumBased()) {
    deviceName = 'Edge (EdgeHTML)';
  } else if (isEdge()) {
    deviceName = 'Edge (Chromium)';
  } else if (isFirefox()) {
    deviceName = 'Firefox';
  } else if (isApple() && !isMobile()) {
    deviceName = 'Safari';
  } else if (isWebOS()) {
    deviceName = 'LG Smart TV';
  } else if (isTizen()) {
    deviceName = 'Samsung Smart TV';
  } else if (isApple() && isMobile()) {
    deviceName = 'iPhone';
  } else if (isAndroid()) {
    deviceName = 'Android';
  }

  return deviceName;
}

/**
 * Connects to the given server with the given credentials without
 * altering the app's API/SDK or axios instance.
 */
export function useOneTimeAPI(
  ...arguments_: Parameters<typeof SDK.createApi>
): Api {
  return SDK.createApi(...arguments_);
}

export default SDK;
