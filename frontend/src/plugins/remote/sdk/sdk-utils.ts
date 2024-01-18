import { type Api, Jellyfin } from '@jellyfin/sdk';
import { type RemovableRef, useStorage } from '@vueuse/core';
import { v4 } from 'uuid';
import type { DeviceState } from './types';
import { mergeExcludingUnknown } from '@/utils/data-manipulation';
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

const state: RemovableRef<DeviceState> = useStorage(
  'deviceProfile',
  {
    deviceId: v4()
  },
  localStorage,
  {
    mergeDefaults: (storageValue, defaults) =>
      mergeExcludingUnknown(storageValue, defaults)
  }
);

const SDK = new Jellyfin({
  clientInfo: {
    name: 'Jellyfin Web (Vue)',
    version: version
  },
  deviceInfo: {
    name: getDeviceName(),
    id: state.value.deviceId
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
