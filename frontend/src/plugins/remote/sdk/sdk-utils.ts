/**
 * We generate an unique name for this device instead of guessing the user's browser based on the user agent:
 * - Browser user agent can be spoofed and is not reliable.
 * - There's a major push to deprecate it: https://developers.google.com/privacy-sandbox/blog/user-agent-reduction-deprecation-trial?hl=es-419
 * - Browsers are so ubiquitous that there are multiple form factors and devices that can run them. We can't easily track
 *   which device the user is using, so the best thing is to not rely on any platform-specific support and provide generic support
 *   for everything, using browser APIs like MediaCapabilities for playback capability detection.
 */
import { type Api, Jellyfin } from '@jellyfin/sdk';
import { v4 } from 'uuid';
import { version } from '@/../package.json';
import { adjectives, animals, colors, countries, languages, names, starWars, uniqueNamesGenerator } from 'unique-names-generator';
import { destr } from 'destr';

interface DeviceInfo {
  id: string;
  name: string;
}

/**
 * Returns the device ID and name, creating it in case it does not exist
 */
function ensureDeviceInfo(): DeviceInfo {
  const storageKey = 'device';
  const storeData = destr<DeviceInfo | null>(window.localStorage.getItem(storageKey));
  
  if (!storeData) {
    const payload = {
      id: v4(),
      name: uniqueNamesGenerator({
        dictionaries: [adjectives, animals, colors, countries, names, languages, starWars],
        separator: '-',
        length: 3
      })
    };

    window.localStorage.setItem(storageKey, JSON.stringify(payload));

    return payload;
  }

  return storeData;
}

const SDK = new Jellyfin({
  clientInfo: {
    name: 'Jellyfin Vue',
    version: version
  },
  deviceInfo: ensureDeviceInfo()
});

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
