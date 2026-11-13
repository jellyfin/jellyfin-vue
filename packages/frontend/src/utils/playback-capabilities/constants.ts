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
 * Longest wait for a probe before a playback is negotiated without it (from the server's data alone). The probe
 * goes on until {@link PROBE_TIMEOUT_MS} and its result is stored for the next playback.
 *
 * Origin: measured in the app (Chrome with network throttling, 16 test files, nothing stored yet), from the first
 * range request of the probe to the PlaybackInfo request: at most 0.12 s locally, 0.23 s at 20 Mbit/s and 20 ms of
 * latency, 0.89 s at 5 Mbit/s and 50 ms, 2.9 s at 1.5 Mbit/s and 150 ms (an MKV needing two windows). At 1.5 Mbit/s
 * the playback then took 0.7 to 17 s to start (median 3.3 s), so waiting the whole {@link PROBE_TIMEOUT_MS} could
 * hold playback for longer than starting it takes. Three seconds covers every measured probe and adds at most about
 * one median start on the slowest link measured; a file whose probe needs more is decided from the server's data the
 * first time only.
 */
export const PROBE_PLAYBACK_WAIT_MS = 3000;

/**
 * == VERSIONS ==
 */

/**
 * Longest wait for the ranking of an item's versions before a playback that did not choose one starts with the
 * server's first version. The ranking probes every version at once, each waiting at most
 * {@link PROBE_PLAYBACK_WAIT_MS}, then asks the browser about each.
 *
 * Origin: measured in the app (Chrome with network throttling, the three-version test item, nothing stored), from the
 * first probe request to the PlaybackInfo request: 0.10 s locally, 0.24 s at 20 Mbit/s and 20 ms of latency, 0.61 s
 * at 5 Mbit/s and 50 ms, 1.87 s at 1.5 Mbit/s and 150 ms, and 2.99 s at 0.4 Mbit/s and 300 ms, where the probe wait
 * ended the probes. With the probes stored, nothing is read before the browser is asked. The probe wait bounds every
 * ranking that progresses, and the browser answered every question in at most 15 ms (see
 * {@link ORACLE_QUERY_TIMEOUT_MS}), so one more second only expires when something stalled, like a browser whose
 * answers never settle.
 */
export const VERSION_RESOLUTION_WAIT_MS = PROBE_PLAYBACK_WAIT_MS + 1000;

/**
 * Seconds the current playback must have buffered ahead (or up to its end) before the next item of the queue is
 * probed, so the probes never compete with it for the network.
 *
 * Origin: measured in the app (Chrome, 1.5 Mbit/s and 150 ms of latency, a 10 s item playing while the three-version
 * item is queued next). Probing as soon as the current item advanced made it stall 1.1 s longer (it ended at 16.8 s
 * against 15.7 s without probing, with the same three waiting events), and the probes took 3.3 s (278 KB). Twenty
 * seconds is six times those probes, and below hls.js's default buffer target (`maxBufferLength`, 30 s), so a playback
 * through hls.js reaches it.
 */
export const PREFETCH_BUFFER_AHEAD_S = 20;

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
 * How often the runtime supervisors sample the media element, in milliseconds: frames, media time, buffer.
 *
 * Origin: five samples per {@link DROPPED_FRAMES_WINDOW_MS} window. Stalls are detected at this granularity, which is
 * enough: every network stall measured under throttling lasted 0.96 s or more (see {@link NETWORK_STALL_MIN_MS}),
 * while in 46 normal playbacks (Chrome 157, Chromium 158, Firefox 159, WebKit 27.2; direct play, remux and
 * transcodes) the media time advanced between every two samples taken 250 ms apart.
 */
export const SUPERVISOR_SAMPLE_MS = 1000;

/**
 * Times hls.js is asked to recover from a fatal media error (`recoverMediaError`) before the failure moves down the
 * failure ladder.
 *
 * Origin: owner decision (plan, "Supervisores en runtime": a fatal media error of hls.js after one
 * `recoverMediaError` is a hard failure).
 */
export const HLS_MEDIA_ERROR_RECOVERIES = 1;

/**
 * Media time that may pass after a load started without any video frame presented before the video counts as
 * producing no frames, which is a hard failure. Once a frame was presented, no wait for the next one counts.
 *
 * Origin: measured in the same 46 normal playbacks: the first frame was counted by 0.24 s of media time at the latest.
 * Chrome given an HEVC file it cannot decode (it claimed it could) counted 0 frames over 11.7 s of media time, and
 * presented none (`requestVideoFrameCallback` never called, measured again in Chrome 157 and Chromium 158 from the
 * start, a resume position and after a seek). Three seconds is twelve times the slowest first frame. A file with one
 * frame every 10 s presents its first frame at once (`requestVideoFrameCallback`) from the start, a resume position or
 * after a seek in Chrome 157, Chromium 158, Firefox 159 and WebKit 27.2 (as MP4; as Matroska WebKit shows no picture at
 * all), then none for 10 s: no wait between frames tells it apart from a decoder that died. Firefox's `totalVideoFrames`
 * stays at 0 until the second frame (10 s), so the counter alone does not say whether one was presented.
 */
export const FRAMES_STALL_MEDIA_SECONDS = 3;

/**
 * Buffering stalls shorter than this do not count for the network supervisor, in milliseconds.
 *
 * Origin: measured: when the network could not keep up (a 10 Mbit/s file through a 4 Mbit/s link) the stalls lasted
 * 0.96 to 2 s while playing the file directly and 1 to 6 s through hls.js, so half a second counts all of them; the
 * waits seen around seeks and starts are shorter (53 ms) and are excluded anyway.
 */
export const NETWORK_STALL_MIN_MS = 500;

/**
 * Stalls within {@link NETWORK_STALL_WINDOW_MS} that make Automatic move down.
 *
 * Origin: measured: once the link stopped carrying the stream, stalls came in quick succession (direct play: two
 * stalls 1.1 s apart once the buffer drained; an encode at 8 Mbit/s through 4 Mbit/s: two stalls 4 s apart), so two
 * within a minute react within seconds, while a single isolated stall does not change the quality.
 */
export const NETWORK_STALL_COUNT = 2;

/**
 * See {@link NETWORK_STALL_COUNT}, in milliseconds.
 *
 * Origin: see {@link NETWORK_STALL_COUNT}.
 */
export const NETWORK_STALL_WINDOW_MS = 60_000;

/**
 * A single stall this long makes Automatic move down while it is still going on, in milliseconds.
 *
 * Origin: measured: through hls.js a stream the link cannot carry (720p at 5 Mbit/s through 3 Mbit/s) stalls for 5.8
 * to 6 s at a time, waiting for each segment; one such stall is reason enough.
 */
export const NETWORK_LONG_STALL_MS = 5000;

/**
 * Share of the network estimate a level may take when Automatic chooses a level by the estimate (moving down, and
 * at the start of a playback, from the estimate remembered for the session).
 *
 * Origin: measured: through a link held at 4 Mbit/s, the estimate of hls.js was 3.98 to 4.08 Mbit/s. The levels'
 * internal bitrates are for the video: audio (128 kbit/s) and the fMP4 framing add a few percent, so 0.8 leaves about
 * 20 % of headroom. With it a 4 Mbit/s link runs 480p (2.5 Mbit/s), which then played 85 s without a stall.
 */
export const NETWORK_DOWN_FACTOR = 0.8;

/**
 * The estimate must be at least this many times the bitrate of the next level up before Automatic moves up.
 *
 * Origin: the owner asked for a wide hysteresis. Moving down accepts a level up to 1/{@link NETWORK_DOWN_FACTOR} = 1.25
 * times the estimate; moving up asks for twice its bitrate, so between the two a level stays (a 4 Mbit/s link that runs
 * 480p never tries 720p, which needs 10 Mbit/s). Measured: after the throttle was lifted Automatic went up one level at
 * a time to the original and stayed there, without going back down, for the 150 s observed.
 */
export const NETWORK_UP_FACTOR = 2;

/**
 * Buffer ahead of the playback position, in seconds, needed before Automatic moves up.
 *
 * Origin: half of hls.js's buffer target (`maxBufferLength`, 30 s in hls.js 1.7). Measured: once the link carried the
 * level, the buffer passed it within 20 s (480p through 4 Mbit/s: 34 s buffered 18 s after the change).
 */
export const NETWORK_UP_MIN_BUFFER_S = 15;

/**
 * Time the up margin must hold before Automatic moves up, in milliseconds.
 *
 * Origin: Jellyfin 12.4 cuts its HLS output in 3 s segments (`#EXT-X-TARGETDURATION:3`, measured), and hls.js updates
 * its estimate once per segment: 20 s span at least six segment loads.
 */
export const NETWORK_UP_SUSTAIN_MS = 20_000;

/**
 * Time after the last change of level before Automatic may move up, in milliseconds.
 *
 * Origin: a change starts a new stream, often a new transcode with an empty buffer: the first segment of an
 * 8 Mbit/s encode took 20 s through a 4 Mbit/s link. Thirty seconds is hls.js's buffer target. Measured: the up steps
 * came 31 s apart and none was undone.
 */
export const NETWORK_UP_HOLD_MS = 30_000;

/**
 * Time a cap Automatic moved down from because of buffering stalls is not tried again during the playback, in
 * milliseconds; it doubles with each step down from that cap.
 *
 * Origin: four times {@link NETWORK_UP_HOLD_MS}, the soonest Automatic may move up again after a change. When the
 * server encodes the upper level slower than real time and the lower one faster, the network estimate at the lower
 * level keeps the margin, so without a wait the upper level was tried again (a new transcode and a stall each time)
 * as soon as the margin held: 60 times an hour in hunter C's simulation of that case; with this wait, 5 times.
 */
export const NETWORK_RETRY_WAIT_MS = 4 * NETWORK_UP_HOLD_MS;

/**
 * Times a manifest (master playlist) that hls.js could not load is loaded again before the playback stops with an
 * error. Counted since the playback last got past the point that failed.
 *
 * Origin: hls.js 1.7.3 gives up on a manifest at once when the request fails without an HTTP status (a dropped
 * connection) and after one retry on a 5xx (`manifestLoadPolicy`), and its `startLoad()` cannot recover a manifest it
 * never loaded. Measured with failures injected in Chrome: one dropped manifest request froze the playback at 0 s for
 * good; with these reloads it played on after the first one. Three reloads at {@link HLS_NETWORK_RECOVERY_DELAY_MS},
 * doubling, wait 7 s in total, in the range of hls.js's own backoff, before the user is told (measured: 11 s from
 * pressing Play to the error when the manifest always fails).
 */
export const HLS_MANIFEST_RELOADS = 3;

/**
 * Times the load of a media playlist or a fragment that hls.js gave up on is resumed before the playback stops with an
 * error. Counted since the playback last got past the fragment that failed.
 *
 * Origin: hls.js 1.7.3 retries these by itself before the error becomes fatal (measured with failures injected in
 * Chrome: a fragment that kept failing was asked for six times over 33 s, a single failure of a playlist or a fragment
 * never reached the app), and each new attempt runs its whole schedule again: one resume covers a stream the server
 * stopped and restarts on demand, and keeps the time to the error near a minute.
 */
export const HLS_STREAM_RESUMES = 1;

/**
 * Wait before the first new attempt after a fatal network error of hls.js, in milliseconds; it doubles with each
 * attempt (see {@link HLS_MANIFEST_RELOADS} and {@link HLS_STREAM_RESUMES}).
 *
 * Origin: the first step of hls.js 1.7.3's own backoff (`retryDelayMs: 1000` in its load policies).
 */
export const HLS_NETWORK_RECOVERY_DELAY_MS = 1000;

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
 * Frame rate the bitrates of {@link QUALITY_LADDER} are for. Above it, a level asks for its bitrate multiplied by
 * (frame rate / {@link QUALITY_LADDER_FRAME_RATE}) ^ {@link HIGH_FRAME_RATE_BITRATE_EXPONENT}.
 *
 * Origin: Jellyfin's rule for the width of an encode (`ResolutionNormalizer.Normalize`, Jellyfin 12.4) weighs the
 * output bitrate against width brackets made for "SDR h264 bitrate at 30fps", scaling it by 30 / fps up to 30 fps and by
 * 1 / sqrt(fps / 30) above; the frame rate is the source's (`MaxFramerate` in the transcoding URL, which the server sets
 * to the stream's `ReferenceFrameRate`). A bitrate multiplied by sqrt(fps / 30) is thus weighed like the ladder's at
 * 30 fps, where every level gets its own width bracket. Measured (Chrome, a 3840x2160 60 fps source): with the 30 fps
 * bitrates the 1440p level came out 1920x1080 and the 1080p level 1280x720.
 */
export const QUALITY_LADDER_FRAME_RATE = 30;

/**
 * See {@link QUALITY_LADDER_FRAME_RATE}: the square root of Jellyfin's `ResolutionNormalizer`.
 */
export const HIGH_FRAME_RATE_BITRATE_EXPONENT = 0.5;

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
 * What an encoded video must be: standard dynamic range (Jellyfin's `VideoRangeType`) and at most this bit depth. Sent
 * to the server as conditions of every video target.
 *
 * Origin: the codec strings of {@link VIDEO_TRANSCODE_TARGETS} describe 8-bit output, which is what the browser is
 * asked about; HDR output is not asked for (plan, "Transcodificar vídeo": SDR, 8 bits; the server's tone mapping is
 * off by default and the client cannot detect it).
 */
export const TRANSCODE_VIDEO_RANGE = 'SDR';

/**
 * See {@link TRANSCODE_VIDEO_RANGE}.
 */
export const TRANSCODE_VIDEO_BIT_DEPTH = 8;

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
 * `MaxStreamingBitrate` sent when the video is not encoded (nothing caps it): no limit in practice, so the server
 * neither refuses direct play nor encodes a stream it was asked to copy.
 *
 * Origin: the largest value Jellyfin 12.4 accepts (the field is an Int32; 2^31 and above are rejected with HTTP 400,
 * measured). Measured with .strm sources: a 59 Mbit/s file was copied with it and encoded under 40 Mbit/s; null, which
 * also lifts the limit, made the server size its own fallback encodes as if the video had no bitrate (an AVI it could
 * not copy came out at 416x234 instead of 640x360), and 0 or -1 put VideoBitrate=64000 in transcoding URLs.
 */
export const UNLIMITED_STREAMING_BITRATE = 2 ** 31 - 1;
