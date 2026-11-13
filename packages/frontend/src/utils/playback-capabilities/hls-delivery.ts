/**
 * How the server's HLS output (every method above direct play: fragmented MP4 segments listed in a playlist) can reach
 * the media element, decided once by detection. The verdict asks the browser its questions about that output the way it
 * will be played, and the player plays it that way, so the two never disagree:
 * - `media-source`: hls.js runs (media source playback) and feeds the segments to the element. Its questions are
 * `media-source` questions.
 * - `native`: hls.js cannot run, but the element plays an HLS playlist by itself. Its questions are `file` questions
 * about the segments (`video/mp4` / `audio/mp4`).
 * - undefined: neither. Nothing above direct play can be played, so nothing above it is asked for.
 */
import { HLS_PLAYLIST_TYPES } from './constants.ts';

export type HlsDelivery = 'media-source' | 'native';

/**
 * What the delivery is detected from
 */
export interface HlsEngine {
  /**
   * Whether hls.js can run in this engine (`Hls.isSupported()`: media source playback with what it needs)
   */
  readonly mediaSourcePlayback: boolean;
  /**
   * The media element's `canPlayType`
   */
  readonly canPlayType: (type: string) => string;
}

/**
 * How the server's HLS output reaches the element: through hls.js whenever it can run, otherwise natively when the
 * element says it plays an HLS playlist (any of {@link HLS_PLAYLIST_TYPES}), otherwise not at all
 */
export function getHlsDelivery(engine: HlsEngine): HlsDelivery | undefined {
  if (engine.mediaSourcePlayback) {
    return 'media-source';
  }

  return HLS_PLAYLIST_TYPES.some(type => engine.canPlayType(type) !== '') ? 'native' : undefined;
}
