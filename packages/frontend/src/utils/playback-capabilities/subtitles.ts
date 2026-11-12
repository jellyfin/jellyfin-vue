/**
 * Subtitle capabilities. Browsers have no API to ask about subtitle formats, so the capability is
 * "the app brings a renderer for it": WebVTT is native, a few formats have client renderers, the server converts
 * the remaining text formats to WebVTT, and everything else has to be burnt into the video.
 */
import type { MediaStream, SubtitleDeliveryMethod, SubtitleProfile } from '@jellyfin/sdk/lib/generated-client';

/**
 * How the selected subtitle reaches the screen:
 * - `native`: the browser renders it (WebVTT)
 * - `renderer`: a client renderer of the registry draws it
 * - `server-text`: a text format the server converts to WebVTT
 * - `burn-in`: the server draws it into the video, which means transcoding the video
 */
export type SubtitleClass = 'native' | 'renderer' | 'server-text' | 'burn-in';

/**
 * A subtitle renderer shipped with the app and the server's codec names it can draw
 */
export interface SubtitleRenderer {
  readonly name: string;
  readonly formats: readonly string[];
}

/**
 * Formats the browser renders by itself (Jellyfin's codec names for WebVTT)
 */
export const NATIVE_SUBTITLE_FORMATS: readonly string[] = ['vtt', 'webvtt'];

/**
 * The renderers the app ships today. Their owner (the player) can pass an extended list to every function of
 * this module.
 */
export const DEFAULT_SUBTITLE_RENDERERS: readonly SubtitleRenderer[] = [
  { name: 'assjs', formats: ['ass', 'ssa'] },
  { name: 'libpgs', formats: ['pgssub'] }
];

/**
 * Lowercased, de-duplicated list of the formats the registry declares
 */
function getRendererFormats(renderers: readonly SubtitleRenderer[]): string[] {
  return [...new Set(renderers.flatMap(renderer => renderer.formats.map(format => format.toLowerCase())))];
}

/**
 * Classifies a subtitle stream into one of the four {@link SubtitleClass}es.
 * External versus embedded is irrelevant: only the format and what the server says about the stream count.
 *
 * @param stream - The subtitle stream, as reported by the server
 * @param renderers - The renderer registry
 */
export function classifySubtitle(
  stream: MediaStream,
  renderers: readonly SubtitleRenderer[] = DEFAULT_SUBTITLE_RENDERERS
): SubtitleClass {
  // Only an explicit `false` blocks: an absent field means the server did not say
  if (stream.SupportsExternalStream === false) {
    return 'burn-in';
  }

  const codec = stream.Codec?.toLowerCase();

  if (codec && NATIVE_SUBTITLE_FORMATS.includes(codec)) {
    return 'native';
  }

  if (codec && getRendererFormats(renderers).includes(codec)) {
    return 'renderer';
  }

  if (stream.IsTextSubtitleStream) {
    return 'server-text';
  }

  return 'burn-in';
}

/**
 * How the server delivers subtitles of a given class
 */
export function getSubtitleDelivery(subtitleClass: SubtitleClass): SubtitleDeliveryMethod {
  return subtitleClass === 'burn-in' ? 'Encode' : 'External';
}

/**
 * The subtitle profiles to declare to the server: the native formats and every format of the registry,
 * always delivered as external files. `Embed` and `Hls` are never declared: the player does not read
 * subtitles from inside the media or from the HLS manifest.
 *
 * @param renderers - The renderer registry
 */
export function getSubtitleProfiles(
  renderers: readonly SubtitleRenderer[] = DEFAULT_SUBTITLE_RENDERERS
): SubtitleProfile[] {
  const formats = new Set([...NATIVE_SUBTITLE_FORMATS, ...getRendererFormats(renderers)]);

  return [...formats].map(format => ({ Format: format, Method: 'External' }));
}
