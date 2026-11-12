/**
 * We generate a unique name for this device instead of guessing the user's browser based on the user agent:
 * - Browser user agent can be spoofed and is not reliable.
 * - There's a major push to deprecate it: https://privacysandbox.google.com/protections/user-agent
 * - Browsers are so ubiquitous that there are multiple form factors and devices that can run them. We can't easily track
 *   which device the user is using, so the best thing is to not rely on any platform-specific support and provide generic support
 *   for everything, using browser APIs like MediaCapabilities for playback capability detection.
 *
 * The name is generated once and persisted, and the user can change it in the settings.
 */
import { type Api, Jellyfin } from '@jellyfin/sdk';
import { v4 } from 'uuid';
import { adjectives, animals, colors, uniqueNamesGenerator } from 'unique-names-generator';
import { version } from '#/package.json';

const deviceNameStorageKey = 'deviceName';

/**
 * Maximum length of the device name. It's the length the server's device model declares
 * (the server doesn't enforce it, but it's a sensible limit for a name anyway).
 */
export const DEVICE_NAME_MAX_LENGTH = 64;

/**
 * Reasons why a device name is not valid
 */
export type DeviceNameError = 'empty' | 'tooLong' | 'invalidCharacters';

/**
 * Validates a device name, which must be already trimmed.
 *
 * Any printable character works end to end, since the SDK percent-encodes the name in the
 * authorization header and the server decodes it. However:
 * - Lone surrogates make the encoding (`encodeURIComponent`) throw, breaking every request.
 * - Control characters (like tabs) have no place in a name.
 *
 * @returns The reason why the name is not valid, or undefined if it's valid
 */
export function validateDeviceName(name: string): DeviceNameError | undefined {
  if (!name) {
    return 'empty';
  }

  if (name.length > DEVICE_NAME_MAX_LENGTH) {
    return 'tooLong';
  }

  if (!name.isWellFormed() || /\p{Cc}/u.test(name)) {
    return 'invalidCharacters';
  }
}

/**
 * Returns the device ID, creating it in case it does not exist
 */
function ensureDeviceId(): string {
  const storageKey = 'deviceId';
  const val = localStorage.getItem(storageKey);

  if (!val) {
    const id = v4();

    localStorage.setItem(storageKey, id);

    return id;
  }

  return val;
}

/**
 * Returns the device name, generating it in case it does not exist (or the stored one is not valid).
 *
 * The generated name has 3 words separated by hyphens (adjective-animal-color). The library only takes
 * as many dictionaries as words requested (in order), so passing more dictionaries would be pointless.
 */
function ensureDeviceName(): string {
  const val = localStorage.getItem(deviceNameStorageKey);

  if (val && !validateDeviceName(val)) {
    return val;
  }

  const name = uniqueNamesGenerator({
    dictionaries: [adjectives, animals, colors],
    separator: '-',
    length: 3
  });

  localStorage.setItem(deviceNameStorageKey, name);

  return name;
}

/**
 * Persists a new name for this device and reloads the app.
 *
 * The reload is needed because the SDK instance (and the authorization header it builds, which
 * carries the device name) is created only once, when the app starts.
 *
 * @throws If the name (after trimming it) is not valid
 */
export function setDeviceName(name: string): void {
  const trimmed = name.trim();
  const error = validateDeviceName(trimmed);

  if (error) {
    throw new Error(`Invalid device name: ${error}`);
  }

  localStorage.setItem(deviceNameStorageKey, trimmed);
  location.reload();
}

const SDK = new Jellyfin({
  clientInfo: {
    name: 'Jellyfin Web (Vue)',
    version: version
  },
  deviceInfo: {
    name: ensureDeviceName(),
    id: ensureDeviceId()
  }
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
