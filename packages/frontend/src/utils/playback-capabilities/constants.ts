/**
 * The only place of the playback capability engine that holds fixed values: thresholds, the quality ladder,
 * the transcoding targets and the fallbacks for missing stream metadata.
 *
 * Everything else is asked to the browser (`navigator.mediaCapabilities`) or read from the file (mediabunny)
 * and from the server (`MediaStream`). If a value has to be fixed, it belongs here, with its origin.
 */

/**
 * == BROWSER QUERIES ==
 */

/**
 * Maximum time to wait for one `navigator.mediaCapabilities.decodingInfo` answer before asking the engine's other
 * native API (`canPlayType` / `isTypeSupported`, see `oracle.ts`) instead. Some WebViews never settle the promise.
 *
 * Origin: measured (161 questions per engine, desktop Linux): the slowest answer took 15 ms in WebKit 27.2,
 * 5 ms in Firefox 159 and 2.3 ms in Chrome 157. One second is a wide margin for slow devices and still bounds the
 * wait when the API never answers (questions are asked in parallel, so each round of questions of a verdict waits one
 * timeout at most, then the other API, which answers at once).
 */
export const ORACLE_QUERY_TIMEOUT_MS = 1000;

/**
 * == FILE PROBING (mediabunny) ==
 */

/**
 * Maximum wall time of one probe, from the first request to the parsed metadata.
 *
 * Origin: measured on a local server with the range windows below, every test container was probed in at most
 * 58 ms in Chromium, Firefox and WebKit (worst: 2 hour MP4 with a 3.45 MiB index at the end). Over slow links the
 * time is dominated by the bytes: the whole {@link PROBE_BYTE_BUDGET} takes about 15 s at 9 Mbit/s, so above that
 * speed the budget, not the clock, ends a pathological probe. A timeout is not cached: the next visit probes again.
 */
export const PROBE_TIMEOUT_MS = 15_000;

/**
 * Size of the byte ranges the probe asks for. mediabunny asks for open-ended ranges (`bytes=N-`) and reads
 * ahead up to 8 MiB per sequential reader; bounding each request makes a reader stop at the end of its window
 * unless the parser still needs more, in which case it asks for the next window.
 *
 * Origin: measured (3 runs per file and engine). Without windows WebKit read up to 21.9 MB (and the server sent
 * up to 44.9 MB) to probe the 2 hour files, against at most 5.8 MB in Chromium. With 2 MiB windows WebKit reads at
 * most 5.8 MB and no engine puts more than 7.4 MB on the wire, at the cost of one more request for files with
 * multi-MiB indexes. 1 MiB windows read slightly less but need two to three more requests for the same files;
 * 4 MiB windows let WebKit read up to 7.9 MB.
 */
export const PROBE_RANGE_WINDOW = 2 * 2 ** 20;

/**
 * Maximum number of bytes a probe may read before giving up.
 *
 * Origin: measured with {@link PROBE_RANGE_WINDOW}: the most any engine read was 5.8 MB (WebKit, 2 hour MP4 with a
 * 3.45 MiB index at the end). A probe reads what the parser needs plus at most one window per reader, so 16 MiB
 * still admits indexes of about 12 MiB; a file that needs more is not worth probing before playback.
 */
export const PROBE_BYTE_BUDGET = 16 * 2 ** 20;

/**
 * Maximum retries of a failed probe request (network errors only: HTTP errors are never retried by mediabunny).
 *
 * Origin: mediabunny's default policy retries forever with exponential backoff, which would make the probe hang;
 * one retry covers a transient hiccup without delaying playback noticeably (measured: an unreachable server fails
 * after 2 requests in about 0.5 s).
 */
export const PROBE_MAX_RETRIES = 1;

/**
 * Delay before retrying a failed probe request, in seconds (the unit mediabunny's `getRetryDelay` expects).
 *
 * Origin: same order of magnitude as mediabunny's own first backoff step (0.5 s).
 */
export const PROBE_RETRY_DELAY_SECONDS = 0.5;

/**
 * == RUNTIME SUPERVISION ==
 */

/**
 * Ratio of dropped frames over decoded frames within one window above which playback counts as not smooth.
 *
 * Origin: owner decision (plan, "Fallos en runtime": more than 20 % of dropped frames).
 */
export const DROPPED_FRAMES_RATIO = 0.2;

/**
 * Length of one dropped frames measurement window, in milliseconds.
 *
 * Origin: owner decision (plan, "Fallos en runtime": windows of 5 s).
 */
export const DROPPED_FRAMES_WINDOW_MS = 5000;

/**
 * Consecutive windows above {@link DROPPED_FRAMES_RATIO} needed to act.
 *
 * Origin: owner decision (plan, "Fallos en runtime": two windows in a row).
 */
export const DROPPED_FRAMES_CONSECUTIVE_WINDOWS = 2;

/**
 * == QUALITY LADDER ==
 */

/**
 * One entry of the quality ladder: the box (width x height) the video must fit in, and the internal
 * bitrate requested from the server when it has to encode at that level.
 */
export interface QualityLadderEntry {
  readonly height: number;
  readonly width: number;
  readonly bitrate: number;
}

/**
 * Quality ladder, from highest to lowest. The menu only shows resolutions: the bitrate is internal.
 *
 * Origin: heights decided by the owner (plan, "Calidad"). Widths are the 16:9 frame of each height.
 * Bitrates are YouTube's recommended H.264 upload bitrates for SDR at standard frame rates
 * (https://support.google.com/youtube/answer/1722171, checked 2026-11-12: 2160p 35-45 Mbps, here the middle
 * value; 1440p 16; 1080p 8; 720p 5; 480p 2.5; 360p 1 Mbps). H.264 is the preferred transcoding target, so the
 * values are those of the least efficient codec the server may encode to.
 */
export const QUALITY_LADDER = [
  { height: 2160, width: 3840, bitrate: 40_000_000 },
  { height: 1440, width: 2560, bitrate: 16_000_000 },
  { height: 1080, width: 1920, bitrate: 8_000_000 },
  { height: 720, width: 1280, bitrate: 5_000_000 },
  { height: 480, width: 854, bitrate: 2_500_000 },
  { height: 360, width: 640, bitrate: 1_000_000 }
] as const satisfies readonly QualityLadderEntry[];

/**
 * == TRANSCODING TARGETS ==
 */

/**
 * A codec the server can be asked to encode to.
 */
export interface TranscodeTarget {
  /**
   * Codec name in Jellyfin's vocabulary, as used in `DeviceProfile` codec lists
   */
  readonly codec: string;
  /**
   * RFC 6381 codec string used to ask the browser whether it can decode the encoded output
   */
  readonly codecString: string;
}

/**
 * Video transcoding targets, in order of preference: H.264 first; AV1 and VP9 are the royalty-free fallback
 * for browsers that cannot decode H.264. A target is only used after the browser says it can decode it.
 *
 * Origin: owner decision (plan, "Destinos de transcodificación"). The codec strings describe 8-bit output at
 * level 4.0 of each codec (1080p class: `avc1.640028` = H.264 High 4.0, `av01.0.08M.08` = AV1 Main 4.0
 * 8-bit, `vp09.00.40.08` = VP9 profile 0 level 4.0 8-bit); the query also carries the real output size,
 * bitrate and frame rate.
 */
export const VIDEO_TRANSCODE_TARGETS = [
  { codec: 'h264', codecString: 'avc1.640028' },
  { codec: 'av1', codecString: 'av01.0.08M.08' },
  { codec: 'vp9', codecString: 'vp09.00.40.08' }
] as const satisfies readonly TranscodeTarget[];

/**
 * Audio transcoding targets, in order of preference: AAC first, Opus as the royalty-free fallback.
 *
 * Origin: owner decision (plan, "Destinos de transcodificación"). `mp4a.40.2` is AAC-LC, the profile
 * the server's AAC encoder produces.
 */
export const AUDIO_TRANSCODE_TARGETS = [
  { codec: 'aac', codecString: 'mp4a.40.2' },
  { codec: 'opus', codecString: 'opus' }
] as const satisfies readonly TranscodeTarget[];

/**
 * Highest channel count kept when audio has to be encoded (5.1). Above it, or when the browser does not
 * accept the target with that many channels, the audio is downmixed to {@link STEREO_CHANNELS}.
 *
 * Origin: owner decision (plan, "Canales: se conserva el envolvente (hasta 5.1)").
 */
export const MAX_TRANSCODE_AUDIO_CHANNELS = 6;

/**
 * Channel count used when surround cannot be kept.
 *
 * Origin: owner decision (plan, "si no, estéreo").
 */
export const STEREO_CHANNELS = 2;

/**
 * == FALLBACKS FOR MISSING STREAM METADATA ==
 */

/**
 * Frame rate used in browser queries when the server reports neither `RealFrameRate` nor `AverageFrameRate`.
 *
 * Origin: the highest of the common film and TV rates (24, 25, 30): overestimating keeps the `smooth`
 * answer on the safe side, and high frame rate content always carries its rate in the metadata.
 */
export const FALLBACK_FRAME_RATE = 30;

/**
 * Bitrate assumed in browser queries when neither the stream nor the media source report one.
 *
 * Origin: the value Jellyfin itself assumes in that case (`StreamBuilder.IsBitrateLimitExceeded`,
 * "If we don't know the item bitrate, then force a transcode if requested max bitrate is under 40 mbps").
 */
export const FALLBACK_BITRATE = 40_000_000;

/**
 * The block size a reported frame height may have been rounded up to: a video fits a level of {@link QUALITY_LADDER}
 * when its short side is at most the level's height rounded up to a multiple of it (1088 is a 1080 video, 1104 is not).
 * The long side does not count: a 1998x1080 or 4096x2160 video is a 1080 or a 2160 one, only wider than the box.
 *
 * Origin: the 16x16 macroblock of H.264 (ITU-T H.264, 7.4.2.1.1: a picture is coded in whole macroblocks, and a file
 * without frame cropping reports the coded size: 1920x1088 for a 1080 encode). It is the largest block among the codecs
 * whose sizes are coded in blocks (MPEG-2, MPEG-4 Part 2 and VC-1 also use 16x16 macroblocks; HEVC codes sizes in
 * multiples of its minimum coding block, 8 or more; VP9 and AV1 code the exact size).
 */
export const CODED_SIZE_ALIGNMENT = 16;

/**
 * `MaxStreamingBitrate` sent when the video is not encoded (nothing caps it): no limit in practice, so the server
 * neither refuses direct play nor encodes a stream it was asked to copy.
 *
 * Origin: the largest value Jellyfin 12.4 accepts (the field is an Int32; 2^31 and above are rejected with HTTP 400,
 * measured). Measured with .strm sources: a 59 Mbit/s file was copied with it and encoded under 40 Mbit/s; null, which
 * also lifts the limit, made the server size its own fallback encodes as if the video had no bitrate (an AVI it could
 * not copy came out at 416x234 instead of 640x360), and 0 or -1 put VideoBitrate=64000 in transcoding URLs.
 */
export const UNLIMITED_STREAMING_BITRATE = 2 ** 31 - 1;
