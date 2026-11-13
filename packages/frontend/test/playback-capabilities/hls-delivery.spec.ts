import { describe, expect, test } from 'vitest';
import { HLS_PLAYLIST_TYPES } from '#/utils/playback-capabilities/constants.ts';
import { getHlsDelivery } from '#/utils/playback-capabilities/hls-delivery.ts';

/**
 * An element's `canPlayType` that answers "maybe" for the given types only
 */
const playsOnly = (types: readonly string[]) => (type: string) => types.includes(type) ? 'maybe' : '';

describe('getHlsDelivery: how the server\'s HLS output reaches the element', () => {
  test('hls.js can run: through media source playback, as before, even when the element also plays HLS', () => {
    expect(getHlsDelivery({ mediaSourcePlayback: true, canPlayType: playsOnly(HLS_PLAYLIST_TYPES) })).toBe('media-source');
    expect(getHlsDelivery({ mediaSourcePlayback: true, canPlayType: playsOnly([]) })).toBe('media-source');
  });

  test.each(HLS_PLAYLIST_TYPES)('hls.js cannot run and the element plays an HLS playlist (%s): natively', (type) => {
    expect(getHlsDelivery({ mediaSourcePlayback: false, canPlayType: playsOnly([type]) })).toBe('native');
  });

  test('neither: no way, so nothing above direct play exists', () => {
    expect(getHlsDelivery({ mediaSourcePlayback: false, canPlayType: playsOnly(['video/mp4']) })).toBeUndefined();
  });
});
