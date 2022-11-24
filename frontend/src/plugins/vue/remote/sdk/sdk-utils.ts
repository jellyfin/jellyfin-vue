import { Api, Jellyfin } from '@jellyfin/sdk';
import { RemovableRef, useStorage } from '@vueuse/core';
import { v4 as uuidv4 } from 'uuid';
import { DeviceState } from './types';
import { version } from '@/../package.json';
import { BrowserDetector } from '@/utils/browser-detection';
import { mergeExcludingUnknown } from '@/utils/data-manipulation';

const state: RemovableRef<DeviceState> = useStorage(
  'deviceProfile',
  {
    deviceId: uuidv4()
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
 * Gets the device's name
 *
 * @returns Device name
 */
function getDeviceName(): string {
  let deviceName = 'Unknown';
  const $browser = new BrowserDetector();

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
