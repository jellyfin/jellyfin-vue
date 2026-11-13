/**
 * The verdict for one media source: how it would be played with the selected tracks, and why.
 *
 * Rungs, from cheapest to most expensive: direct play < remux < audio transcode < video transcode. The rules
 * decide the lowest rung the streams require; the result is the lowest rung at or above it that the browser can
 * decode, that the quality mode and the user policy allow.
 *
 * A stream nobody could ask the browser about exactly is assumed to play (owner's decision, 2026-11-13): an
 * "unsupported" answer to a question that could not be asked with an exact codec string is no evidence. That is a
 * stream asked about only with generic candidates (the server's names, see `media-config.ts`) that the browser did not
 * confirm, or a stream that cannot be asked about at all. The verdict is then the cheapest method assuming such streams
 * play, marked `unverified`, and everything that does not depend on them still applies. It is a single attempt: once
 * the ladder learned anything for the same streams (a floor for the verdict's signature: the attempt failed, or the
 * server needed more), nothing is assumed any more, and every stream whose support is still unknown is encoded. A
 * question playback disproved (`DISPROVED`) is evidence, generic or not.
 */
import type { MediaSourceInfo, MediaStream, SubtitleDeliveryMethod, UserPolicy } from '@jellyfin/sdk/lib/generated-client';
import {
  AUDIO_TRANSCODE_TARGETS,
  CODED_SIZE_ALIGNMENT,
  FALLBACK_FRAME_RATE,
  MAX_TRANSCODE_AUDIO_CHANNELS,
  STEREO_CHANNELS,
  VIDEO_TRANSCODE_TARGETS,
  type TranscodeTarget
} from './constants.ts';
import {
  getAudioTargetCandidate,
  getHdrFields,
  getKnownValue,
  getStreamCandidates,
  getStreamCodecStrings,
  getStreamQuestions,
  getVideoTargetCandidate,
  type DecodingMode,
  type StreamQuestion,
  type VideoTargetParams
} from './media-config.ts';
import type { HlsDelivery } from './hls-delivery.ts';
import type { CapabilityOracle, QueryContext } from './oracle.ts';
import type { ProbedTrack, ProbeResult } from './probe.ts';
import {
  exceedsQuality,
  getModeLevel,
  getRequestCaps,
  getTranscodeLevel,
  type QualityMode,
  type RequestCaps
} from './quality.ts';
import { classifySubtitle, getSubtitleDelivery, type SubtitleClass, type SubtitleRenderer } from './subtitles.ts';

/**
 * The playback methods that can be chosen, from cheapest to most expensive
 */
export const PLAYBACK_RUNGS = ['DirectPlay', 'Remux', 'TranscodeAudio', 'TranscodeVideo'] as const;

/**
 * One of {@link PLAYBACK_RUNGS}
 */
export type PlaybackRung = typeof PLAYBACK_RUNGS[number];

/**
 * How a media source is played, or `Unplayable`
 */
export type PlaybackMethod = PlaybackRung | 'Unplayable';

/**
 * Why a verdict is what it is:
 * - `ContainerUnsupported`: a stream plays through media source playback but not inside the file's container
 * - `VideoCodecUnsupported` / `AudioCodecUnsupported`: the stream does not play in any way
 * - `HdrOnSdrDisplay`: HDR video on an SDR display, tone-mapped by the server
 * - `SubtitleBurnIn`: the selected subtitle has to be burnt into the video
 * - `ExceedsQuality`: the video is larger than the chosen quality
 * - `SecondaryAudioTrack`: the selected audio is not the file's first audio track and the player cannot switch
 * - `ExternalAudioTrack`: the selected audio is an external file the server has to mux in
 * - `FailedBefore`: a cheaper method is known not to work for these streams (it failed, or the server needed more)
 * - `NotSmooth`: the browser says the chosen path will not play smoothly
 * - `NotAllowedByQuality` / `NotAllowedByPolicy`: a cheaper method was possible but not allowed
 * - `NoDecodableTarget`: the browser decodes none of the transcoding targets
 * - `NoHlsPlayback`: the browser cannot play the server's HLS output at all (no media source playback, no native HLS),
 * so nothing above direct play exists
 * - `Unverified`: the method relies on a stream nobody could check (no stream metadata, or no exact question about
 * it): it is an attempt (see the module documentation)
 */
export type VerdictReason
  = | 'ContainerUnsupported'
    | 'VideoCodecUnsupported'
    | 'AudioCodecUnsupported'
    | 'HdrOnSdrDisplay'
    | 'SubtitleBurnIn'
    | 'ExceedsQuality'
    | 'SecondaryAudioTrack'
    | 'ExternalAudioTrack'
    | 'FailedBefore'
    | 'NotSmooth'
    | 'NotAllowedByQuality'
    | 'NotAllowedByPolicy'
    | 'NoDecodableTarget'
    | 'NoHlsPlayback'
    | 'Unverified';

/**
 * The user policy flags that matter for playback (undefined counts as allowed, the server's default)
 */
export type PlaybackPolicy = Pick<UserPolicy, 'EnableVideoPlaybackTranscoding' | 'EnableAudioPlaybackTranscoding' | 'EnablePlaybackRemuxing'>;

/**
 * The minimum method known to be needed for a combination of streams (by its {@link Verdict.signature}),
 * learned this session; `Unplayable` when every rung failed. See {@link getNextFloor}.
 */
export type LearnedFloor = (signature: string) => PlaybackMethod | undefined;

/**
 * What a caller learned about a verdict: the playback failed at a rung, or the server chose another method
 * than the verdict's (as read by `deriveActualMethod`)
 */
export type PlaybackOutcome
  = | { readonly failedAt: PlaybackRung }
    | { readonly actualMethod: PlaybackMethod };

/**
 * Everything about the client the verdict depends on, as plain values
 */
export interface VerdictEnvironment {
  /**
   * Whether the display is HDR; undefined when the engine cannot tell
   */
  readonly hdrDisplay: boolean | undefined;
  /**
   * `display`: HDR video on an SDR display is tone-mapped by the server; `browser`: the browser adapts it
   */
  readonly hdrMode: 'display' | 'browser';
  /**
   * Whether the media element exposes working `audioTracks`, so it can switch audio tracks of a file
   */
  readonly canSelectAudioTrack: boolean;
  readonly quality: QualityMode;
  readonly policy: PlaybackPolicy;
  /**
   * The learned minimum method for a signature; the verdict never starts below it
   */
  readonly getLearnedFloor: LearnedFloor;
  /**
   * The subtitle renderers the player ships (see `subtitles.ts`)
   */
  readonly subtitleRenderers: readonly SubtitleRenderer[];
  /**
   * How the server's HLS output reaches the element (see `hls-delivery.ts`): the questions about every rung above
   * direct play are asked that way. Undefined when it cannot be played at all: only direct play exists.
   */
  readonly hlsDelivery: HlsDelivery | undefined;
}

/**
 * Input of {@link computeVerdict}
 */
export interface VerdictInput {
  readonly source: MediaSourceInfo;
  /**
   * Absolute `MediaStream.Index` of the video stream; undefined, or an index the source does not have, means the first
   * video stream
   */
  readonly videoStreamIndex?: number;
  /**
   * Absolute `MediaStream.Index` of the audio stream; undefined, or an index the source does not have, means the
   * source's default
   */
  readonly audioStreamIndex?: number;
  /**
   * Absolute `MediaStream.Index` of the subtitle stream; undefined means the source's default, -1 means none
   */
  readonly subtitleStreamIndex?: number;
  readonly probe?: ProbeResult;
  readonly oracle: CapabilityOracle;
  readonly environment: VerdictEnvironment;
  /**
   * The media type of the item the source belongs to (see {@link getItemType}). Undefined counts as video for a source
   * without stream metadata, since nothing else tells whether it has video, and follows the streams otherwise.
   */
  readonly mediaType?: 'Video' | 'Audio';
}

/**
 * The type of item the server sees: the item's media type when known, since the server treats a video item as a video
 * whatever its streams (measured on Jellyfin 12.4 with an audio-only file in a movie library: Audio profiles got neither
 * direct play nor a transcoding URL, Video profiles got its HLS output, and without the permission to transcode video a
 * progressive stream instead), otherwise whether it has a video stream
 */
function getItemType(input: VerdictInput, hasVideo: boolean): 'Video' | 'Audio' {
  return input.mediaType ?? (hasVideo ? 'Video' : 'Audio');
}

/**
 * A transcoding target the browser decodes, with the channel count it accepts (audio only)
 */
export interface SupportedTarget extends TranscodeTarget {
  readonly channels?: number;
}

/**
 * What happens to a stream: copied as it is, or encoded to the first of `targets` the server can produce
 * (all of them decodable by the browser, in order of preference).
 *
 * A copied stream of a video carries the same targets as `fallback`: the server may still refuse to copy it
 * (measured on Jellyfin 12.4: a streaming bitrate below the source's, a codec its HLS output cannot carry) and then
 * encodes it to the first codec of the request's list it can produce. Audio items have none: the server takes a
 * single codec for them.
 *
 * `index` is the stream's absolute `MediaStream.Index`; undefined when nobody knows the source's streams (see
 * {@link getBlindVerdict}). A copied stream nobody could check is marked `unverified`: it is copied on the assumption
 * that it plays.
 */
export type StreamPlan
  = | { readonly index?: number; readonly action: 'copy'; readonly fallback?: readonly SupportedTarget[]; readonly unverified?: true }
    | { readonly index?: number; readonly action: 'transcode'; readonly targets: readonly SupportedTarget[] };

/**
 * The selected subtitle and how it reaches the screen
 */
export interface SubtitlePlan {
  readonly index: number;
  readonly class: SubtitleClass;
  readonly delivery: SubtitleDeliveryMethod;
}

/**
 * The verdict for one media source
 */
export interface Verdict {
  readonly method: PlaybackMethod;
  readonly reasons: readonly VerdictReason[];
  /**
   * What the browser says about the smoothness of the chosen path. It never changes the method: it only scores.
   */
  readonly smooth: boolean;
  /**
   * True when the method relies on a stream nobody could check, assumed to play: it is an attempt
   */
  readonly unverified: boolean;
  readonly video?: StreamPlan;
  readonly audio?: StreamPlan;
  readonly subtitle?: SubtitlePlan;
  /**
   * Channel cap for the encoded audio, when the audio is encoded
   */
  readonly maxAudioChannels?: number;
  /**
   * Caps for the encoded video, when the video is encoded
   */
  readonly qualityCap?: RequestCaps;
  /**
   * The evaluated streams (container MIME + codec strings), the key of the session failure memory. Opaque: read
   * {@link Verdict.codecs} for what it names.
   */
  readonly signature: string;
  /**
   * The codec string of each evaluated stream, as first asked about for the file (undefined for a stream nobody knows)
   */
  readonly codecs?: { readonly video?: string; readonly audio?: string };
  /**
   * The source's quality, used to break ties between versions
   */
  readonly quality: { readonly width?: number; readonly height?: number; readonly bitrate?: number };
  /**
   * Set when the browser cannot play the server's HLS output (see {@link VerdictEnvironment.hlsDelivery}): the server must
   * not be offered it, not even as the fallback of a direct play
   */
  readonly onlyDirectPlay?: true;
  /**
   * The type of item the server sees (see {@link getItemType}), which decides the type of the profiles it takes
   */
  readonly mediaType?: 'Video' | 'Audio';
}

/**
 * How one stream fares in one mode. `verified` is false when the browser could not tell: the stream is then assumed to
 * play (`supported`) on the first attempt, and assumed not to once that attempt is spent.
 */
interface Support {
  readonly supported: boolean;
  readonly smooth: boolean;
  readonly verified: boolean;
}

/**
 * A stream of the source with what the probe found about it
 */
interface StreamContext {
  readonly stream: MediaStream;
  readonly probed?: ProbedTrack;
  readonly containerMime?: string;
  readonly containerImpliesCodec?: boolean;
}

/**
 * A rung that can be played, with its plan
 */
interface RungPlan {
  readonly video?: StreamPlan;
  readonly audio?: StreamPlan;
  readonly smooth: boolean;
  readonly verified: boolean;
}

/**
 * Why a rung was not chosen; `hls`: the browser cannot play the server's HLS output, which every rung above direct play
 * is delivered as
 */
type RungRejection = 'browser' | 'quality' | 'policy' | 'hls';

/**
 * Transcoding targets the browser decodes, with the smoothness of the first one
 */
interface TargetSet {
  readonly targets: readonly SupportedTarget[];
  readonly smooth: boolean;
}

/**
 * Everything evaluated about a source, shared by the rules and the rung plans
 */
interface Evaluation {
  readonly input: VerdictInput;
  readonly streams: MediaStream[];
  readonly video?: StreamContext;
  readonly audio?: StreamContext;
  readonly subtitle?: SubtitlePlan;
  readonly videoFile?: Support;
  readonly videoMs?: Support;
  readonly audioFile?: Support;
  readonly audioMs?: Support;
  readonly signature: string;
  readonly codecs: NonNullable<Verdict['codecs']>;
  readonly qualityCap?: RequestCaps;
  readonly videoTargets: () => Promise<TargetSet | undefined>;
  readonly audioTargets: () => Promise<TargetSet | undefined>;
}

const NOT_SUPPORTED: Support = { supported: false, smooth: false, verified: true };

/**
 * The support of a stream the browser could not tell about: assumed to play on the first attempt, not after
 */
function getUnknownSupport(assume: boolean): Support {
  return assume ? { supported: true, smooth: true, verified: false } : { supported: false, smooth: false, verified: false };
}

/**
 * Asks the oracle about the candidates of a stream: supported if any is. "Unsupported" is evidence only from an exact
 * candidate or from playback (a disproved answer); exact answers win, so generic candidates only count when there is
 * no exact one. Without evidence (no candidate at all, or generic ones the browser did not confirm) the browser could
 * not tell (see {@link getUnknownSupport}).
 */
async function evaluate(
  oracle: CapabilityOracle,
  questions: readonly StreamQuestion[],
  context: QueryContext | undefined,
  assume: boolean
): Promise<Support> {
  const exact = questions.filter(question => !question.generic);
  const asked = exact.length > 0 ? exact : questions;
  const answers = await Promise.all(asked.map(async question => oracle.query(question.config, context)));
  const first = answers.find(answer => answer.supported);

  if (first) {
    return { supported: true, smooth: first.smooth, verified: true };
  }

  return exact.length > 0 || answers.some(answer => answer.disproved) ? NOT_SUPPORTED : getUnknownSupport(assume);
}

/**
 * Finds a stream of a type by its absolute index; when the source has no such stream (no index, or one that is not
 * in the source), the one of the default index, and else the first one of that type, which is what the server plays
 */
function pickStream(
  streams: MediaStream[],
  type: MediaStream['Type'],
  index: number | null | undefined,
  defaultIndex?: number | null
): MediaStream | undefined {
  const ofType = streams.filter(stream => stream.Type === type);
  const find = (wanted: number | null | undefined) =>
    typeof wanted === 'number' && wanted >= 0 ? ofType.find(stream => stream.Index === wanted) : undefined;

  return find(index) ?? find(defaultIndex) ?? ofType[0];
}

/**
 * The selected subtitle and its class: the explicit index, -1 for none, or the source's default
 */
function pickSubtitle(input: VerdictInput, streams: MediaStream[]): SubtitlePlan | undefined {
  const index = input.subtitleStreamIndex ?? input.source.DefaultSubtitleStreamIndex;
  const stream = typeof index === 'number' && index >= 0
    ? streams.find(candidate => candidate.Type === 'Subtitle' && candidate.Index === index)
    : undefined;

  if (!stream) {
    return;
  }

  const subtitleClass = classifySubtitle(stream, input.environment.subtitleRenderers);

  return { index: stream.Index ?? -1, class: subtitleClass, delivery: getSubtitleDelivery(subtitleClass) };
}

/**
 * Whether a number of the server and the same number read by the probe contradict each other: both known and the
 * probe's above the server's. The probe reads what the headers of the base layer code; the server reports what its
 * decoder outputs, which a codec's extensions only add to (spectral band replication doubles the coded sample rate;
 * parametric stereo, DTS-HD and E-AC-3 dependent substreams add channels to the core's).
 */
function contradictsCodedValue(server: number | null | undefined, probed: number): boolean {
  const serverValue = getKnownValue(server);
  const probedValue = getKnownValue(probed);

  return serverValue !== undefined && probedValue !== undefined && probedValue > serverValue;
}

/**
 * Whether a dimension of the server and the probe's contradict each other: both known and at least one coding block
 * apart (see {@link CODED_SIZE_ALIGNMENT}). Both are measured before any rotation (measured on Jellyfin 12.4 and
 * mediabunny 1.65 with a 640x360 MP4 rotated by 90 degrees: both report 640x360).
 */
function contradictsSize(server: number | null | undefined, probed: number): boolean {
  const serverValue = getKnownValue(server);
  const probedValue = getKnownValue(probed);

  return serverValue !== undefined && probedValue !== undefined && Math.abs(serverValue - probedValue) >= CODED_SIZE_ALIGNMENT;
}

/**
 * Whether what the server and the probe both report about a stream contradicts each other
 */
function contradicts(stream: MediaStream, track: ProbedTrack): boolean {
  return track.type === 'video'
    ? contradictsSize(stream.Width, track.width) || contradictsSize(stream.Height, track.height)
    : contradictsCodedValue(stream.Channels, track.channels) || contradictsCodedValue(stream.SampleRate, track.sampleRate);
}

/**
 * Matches a stream with its probed track: by order among the embedded streams of the same type, only when the pairing
 * can be trusted, that is, the probe found as many tracks of the type as the server lists and none contradicts its
 * stream. mediabunny skips some streams (TrueHD, LPCM and AAC-LATM in MPEG-TS, declared streams without packets), so
 * by order alone a stream could be judged with the codec string of another one. Otherwise no stream of the type is
 * paired: they are asked about as if not probed, still with the probed container.
 */
function getContext(streams: MediaStream[], stream: MediaStream, probe: ProbeResult | undefined): StreamContext {
  if (probe?.status !== 'ok' || stream.IsExternal) {
    return { stream };
  }

  const embedded = streams.filter(candidate => candidate.Type === stream.Type && !candidate.IsExternal);
  const tracks: readonly ProbedTrack[] = stream.Type === 'Video' ? probe.video : probe.audio;
  const trusted = embedded.length === tracks.length && embedded.every((candidate, index) => !contradicts(candidate, tracks[index]!));

  return {
    stream,
    probed: trusted ? tracks[embedded.indexOf(stream)] : undefined,
    containerMime: probe.containerMime,
    containerImpliesCodec: probe.containerImpliesCodec
  };
}

/**
 * Candidates of a stream in a mode
 */
function candidatesFor(source: MediaSourceInfo, context: StreamContext, mode: DecodingMode): MediaDecodingConfiguration[] {
  return getStreamCandidates({ source, ...context, mode });
}

/**
 * Candidates of a stream in a mode, marked generic or exact
 */
function questionsFor(source: MediaSourceInfo, context: StreamContext, mode: DecodingMode): StreamQuestion[] {
  return getStreamQuestions({ source, ...context, mode });
}

/**
 * The configurations the verdict asks about one stream of a source copied into the server's HLS output (through media
 * source playback, or as fragmented MP4 files when the element plays the HLS itself), so a caller that sees that path
 * fail for the stream can learn it
 *
 * @param source - The media source the verdict was computed for
 * @param streamIndex - Absolute `MediaStream.Index` of a video or audio stream of the source
 * @param probe - The probe result the verdict was computed with
 * @param delivery - How the HLS output reaches the element, as in the verdict's environment (none: nothing is asked)
 */
export function getMediaSourceQuestions(
  source: MediaSourceInfo,
  streamIndex: number,
  probe: ProbeResult | undefined,
  delivery: HlsDelivery | undefined
): MediaDecodingConfiguration[] {
  const streams = source.MediaStreams ?? [];
  const stream = streams.find(candidate =>
    candidate.Index === streamIndex && (candidate.Type === 'Video' || candidate.Type === 'Audio'));

  return stream && delivery ? candidatesFor(source, getContext(streams, stream, probe), delivery) : [];
}

/**
 * What the server would encode the video to: the source scaled down to fit the caps, keeping its aspect ratio (the
 * box of the caps when the size is unknown), at the caps' bitrate and the source's frame rate
 */
function getVideoTargetParams(context: StreamContext | undefined, caps: RequestCaps): VideoTargetParams {
  const probedVideo = context?.probed?.type === 'video' ? context.probed : undefined;
  const width = getKnownValue(context?.stream.Width) ?? getKnownValue(probedVideo?.width) ?? caps.maxWidth;
  const height = getKnownValue(context?.stream.Height) ?? getKnownValue(probedVideo?.height) ?? caps.maxHeight;
  const scale = Math.min(1, caps.maxWidth / width, caps.maxHeight / height);

  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
    bitrate: caps.maxBitrate,
    framerate: getKnownValue(context?.stream.RealFrameRate) ?? getKnownValue(context?.stream.AverageFrameRate) ?? FALLBACK_FRAME_RATE
  };
}

/**
 * No target: the server's HLS output, which they would be delivered in, cannot be played
 */
const NO_TARGETS: TargetSet = { targets: [], smooth: false };

/**
 * The video targets the browser decodes, in order of preference
 */
async function findVideoTargets(oracle: CapabilityOracle, params: VideoTargetParams, delivery: HlsDelivery | undefined): Promise<TargetSet> {
  if (!delivery) {
    return NO_TARGETS;
  }

  const answers = await Promise.all(VIDEO_TRANSCODE_TARGETS.map(async target =>
    oracle.query(getVideoTargetCandidate(target, params, delivery))));

  return {
    targets: VIDEO_TRANSCODE_TARGETS.filter((_, index) => answers[index]?.supported),
    smooth: answers.find(answer => answer.supported)?.smooth ?? false
  };
}

/**
 * The channels of an audio stream, as the server or the probe report them; stereo when unknown
 */
function getChannels(context: StreamContext): number {
  const probedAudio = context.probed?.type === 'audio' ? context.probed : undefined;

  return getKnownValue(context.stream.Channels) ?? getKnownValue(probedAudio?.channels) ?? STEREO_CHANNELS;
}

/**
 * The audio targets the browser decodes, in order of preference. Each keeps the source's channels up to 5.1 if
 * the browser accepts it with that many, otherwise stereo.
 */
async function findAudioTargets(oracle: CapabilityOracle, sourceChannels: number, delivery: HlsDelivery | undefined): Promise<TargetSet> {
  if (!delivery) {
    return NO_TARGETS;
  }

  const wanted = Math.min(sourceChannels, MAX_TRANSCODE_AUDIO_CHANNELS);
  const results = await Promise.all(AUDIO_TRANSCODE_TARGETS.map(async (target) => {
    const kept = await oracle.query(getAudioTargetCandidate(target, { channels: wanted }, delivery));

    if (kept.supported || wanted <= STEREO_CHANNELS) {
      return { target: { ...target, channels: wanted }, answer: kept };
    }

    const stereo = await oracle.query(getAudioTargetCandidate(target, { channels: STEREO_CHANNELS }, delivery));

    return { target: { ...target, channels: STEREO_CHANNELS }, answer: stereo };
  }));
  const supported = results.filter(result => result.answer.supported);

  return { targets: supported.map(result => result.target), smooth: supported[0]?.answer.smooth ?? false };
}

/**
 * Runs a function once, on demand
 */
function lazy<T>(compute: () => Promise<T>): () => Promise<T> {
  let value: Promise<T> | undefined;

  return async () => (value ??= compute());
}

/**
 * The part of the signature for one stream: its first direct play question, or the server's names
 */
function getStreamSignature(source: MediaSourceInfo, context: StreamContext | undefined): string | undefined {
  if (!context) {
    return;
  }

  const [first] = candidatesFor(source, context, 'file');

  return first?.video?.contentType ?? first?.audio?.contentType ?? `${source.Container ?? ''}:${context.stream.Codec ?? ''}`;
}

/**
 * The codec string a stream is first asked about for the file
 */
function getFirstCodecString(source: MediaSourceInfo, context: StreamContext | undefined): string | undefined {
  return context ? getStreamCodecStrings({ source, ...context, mode: 'file' })[0] : undefined;
}

/**
 * Evaluates the selected streams of a source in both modes
 */
async function evaluateSource(input: VerdictInput, videoStream?: MediaStream, audioStream?: MediaStream): Promise<Evaluation> {
  const { source, oracle } = input;
  const delivery = input.environment.hlsDelivery;
  const streams = source.MediaStreams ?? [];
  const video = videoStream ? getContext(streams, videoStream, input.probe) : undefined;
  const audio = audioStream ? getContext(streams, audioStream, input.probe) : undefined;
  const signature = [getStreamSignature(source, video), getStreamSignature(source, audio)].filter(Boolean).join('|');
  // A single attempt: once anything was learned for these streams, nothing is assumed
  const assume = input.environment.getLearnedFloor(signature) === undefined;
  // Direct play questions are about the probed file, whose MIME type the oracle's fallback may need
  const askFile = (context: StreamContext) =>
    evaluate(oracle, questionsFor(source, context, 'file'), { fileType: context.containerMime }, assume);
  // Inside the server's HLS output, asked the way it reaches the element; without a way, nothing plays there
  const askHls = async (context: StreamContext) =>
    delivery ? evaluate(oracle, questionsFor(source, context, delivery), undefined, assume) : NOT_SUPPORTED;
  // An external audio file is not part of the file, so it never plays as part of it
  const audioFileQuestion = audio?.stream.IsExternal ? NOT_SUPPORTED : audio && askFile(audio);
  const [videoFile, videoMs, audioFile, audioMs] = await Promise.all([
    video && askFile(video),
    video && askHls(video),
    audioFileQuestion,
    audio && askHls(audio)
  ]);
  const qualityCap = video
    ? getRequestCaps(getTranscodeLevel(video.stream, getModeLevel(input.environment.quality)), video.stream)
    : undefined;

  return {
    input,
    streams,
    video,
    audio,
    subtitle: pickSubtitle(input, streams),
    videoFile,
    videoMs,
    audioFile,
    audioMs,
    signature,
    codecs: { video: getFirstCodecString(source, video), audio: getFirstCodecString(source, audio) },
    qualityCap,
    videoTargets: lazy(async () => video && qualityCap ? findVideoTargets(oracle, getVideoTargetParams(video, qualityCap), delivery) : undefined),
    audioTargets: lazy(async () => audio ? findAudioTargets(oracle, getChannels(audio), delivery) : undefined)
  };
}

/**
 * Why a stream needs more than it was asked: what the browser answered, or, when the browser could not tell and the
 * attempt that assumed it plays is spent, that a cheaper method failed
 */
function getUnsupportedReason(reason: VerdictReason, ...supports: (Support | undefined)[]): VerdictReason {
  return supports.every(support => support?.verified !== false) ? reason : 'FailedBefore';
}

/**
 * The requirements of the video stream: remux when only the container fails, transcode when nothing plays
 */
function getVideoRequirements(evaluation: Evaluation): [PlaybackRung, VerdictReason][] {
  const { video, videoFile, videoMs, subtitle, input } = evaluation;
  const { environment } = input;
  const requirements: [PlaybackRung, VerdictReason][] = [];

  if (!video) {
    return requirements;
  }

  if (videoFile?.supported === false) {
    requirements.push(videoMs?.supported
      ? ['Remux', getUnsupportedReason('ContainerUnsupported', videoFile)]
      : ['TranscodeVideo', getUnsupportedReason('VideoCodecUnsupported', videoFile, videoMs)]);
  }

  if (subtitle?.class === 'burn-in') {
    requirements.push(['TranscodeVideo', 'SubtitleBurnIn']);
  }

  if (environment.hdrDisplay === false && environment.hdrMode === 'display' && getHdrFields(video.stream, video.probed)) {
    requirements.push(['TranscodeVideo', 'HdrOnSdrDisplay']);
  }

  if (exceedsQuality(video.stream, environment.quality)) {
    requirements.push(['TranscodeVideo', 'ExceedsQuality']);
  }

  return requirements;
}

/**
 * The requirements of the audio stream: external and secondary tracks need the server to mux them, and an
 * audio that plays in no way has to be encoded
 */
function getAudioRequirements(evaluation: Evaluation): [PlaybackRung, VerdictReason][] {
  const { audio, audioFile, audioMs, streams, input } = evaluation;
  const requirements: [PlaybackRung, VerdictReason][] = [];

  if (!audio || !audioFile || !audioMs) {
    return requirements;
  }

  const firstEmbeddedAudio = streams.find(stream => stream.Type === 'Audio' && !stream.IsExternal);

  if (audio.stream.IsExternal) {
    requirements.push(['Remux', 'ExternalAudioTrack']);
  } else if (!audioFile.supported && audioMs.supported) {
    requirements.push(['Remux', getUnsupportedReason('ContainerUnsupported', audioFile)]);
  } else if (audio.stream !== firstEmbeddedAudio && !input.environment.canSelectAudioTrack) {
    requirements.push(['Remux', 'SecondaryAudioTrack']);
  }

  if (!audioFile.supported && !audioMs.supported) {
    requirements.push(['TranscodeAudio', getUnsupportedReason('AudioCodecUnsupported', audioFile, audioMs)]);
  }

  return requirements;
}

/**
 * The position of a method in the ladder: the rungs in order, then `Unplayable`
 */
function getMethodOrder(method: PlaybackMethod): number {
  return method === 'Unplayable' ? PLAYBACK_RUNGS.length : PLAYBACK_RUNGS.indexOf(method);
}

/**
 * Whether a method is above another one in the ladder (`Unplayable` is above every rung)
 *
 * @param method - The method to compare
 * @param than - The method it is compared with
 */
export function isMoreExpensive(method: PlaybackMethod, than: PlaybackMethod): boolean {
  return getMethodOrder(method) > getMethodOrder(than);
}

/**
 * The method one step up the ladder (`Unplayable` after the last rung)
 */
function getNextMethod(rung: PlaybackRung): PlaybackMethod {
  return PLAYBACK_RUNGS[PLAYBACK_RUNGS.indexOf(rung) + 1] ?? 'Unplayable';
}

/**
 * The learned floor after an outcome, so every caller records it the same way. Floors only rise:
 * - the playback failed at a rung: the floor becomes the next rung (`Unplayable` after the last one)
 * - the server chose a more expensive method than the verdict's: the floor becomes that method
 * - the server could not play it at all: like a failure at the verdict's method
 * - the server chose the same or a cheaper method, or the verdict was unplayable: nothing is learned
 *
 * @param verdict - The verdict the playback was negotiated with
 * @param outcome - What happened
 * @param current - The floor stored so far for the verdict's signature
 * @returns The floor to store for the verdict's signature
 */
export function getNextFloor(
  verdict: Pick<Verdict, 'method'>,
  outcome: PlaybackOutcome,
  current?: PlaybackMethod
): PlaybackMethod | undefined {
  let learned: PlaybackMethod | undefined;

  if ('failedAt' in outcome) {
    learned = getNextMethod(outcome.failedAt);
  } else if (verdict.method !== 'Unplayable') {
    if (outcome.actualMethod === 'Unplayable') {
      learned = getNextMethod(verdict.method);
    } else if (getMethodOrder(outcome.actualMethod) > getMethodOrder(verdict.method)) {
      learned = outcome.actualMethod;
    }
  }

  if (learned === undefined) {
    return current;
  }

  return current !== undefined && getMethodOrder(current) >= getMethodOrder(learned) ? current : learned;
}

/**
 * The lowest rung the streams require, with the reasons
 */
function getRequirements(evaluation: Evaluation): { minRung: number; reasons: VerdictReason[] } {
  const requirements = [...getVideoRequirements(evaluation), ...getAudioRequirements(evaluation)];
  const floor = evaluation.input.environment.getLearnedFloor(evaluation.signature);
  const floorRung = floor === undefined ? 0 : getMethodOrder(floor);
  const rungs = [0, ...requirements.map(([rung]) => getMethodOrder(rung)), floorRung];

  return {
    minRung: Math.max(...rungs),
    reasons: [...requirements.map(([, reason]) => reason), ...(floorRung > 0 ? ['FailedBefore' as const] : [])]
  };
}

/**
 * The plan of a copied stream, marked when its support is assumed
 */
function copyPlan(context: StreamContext, support: Support | undefined): StreamPlan {
  return { index: context.stream.Index ?? -1, action: 'copy', ...(support?.verified === false && { unverified: true }) };
}

/**
 * A plan that copies both streams, when both are supported in the given mode
 */
function planCopy(evaluation: Evaluation, videoSupport?: Support, audioSupport?: Support): RungPlan | undefined {
  if (videoSupport?.supported === false || audioSupport?.supported === false) {
    return;
  }

  const { video, audio } = evaluation;

  return {
    video: video && copyPlan(video, videoSupport),
    audio: audio && copyPlan(audio, audioSupport),
    smooth: (videoSupport?.smooth ?? true) && (audioSupport?.smooth ?? true),
    verified: (videoSupport?.verified ?? true) && (audioSupport?.verified ?? true)
  };
}

/**
 * Audio transcode: the video is copied (through media source playback), the audio encoded
 */
async function planTranscodeAudio(evaluation: Evaluation): Promise<RungPlan | undefined> {
  const { video, audio, videoMs } = evaluation;
  const found = await evaluation.audioTargets();

  if (!audio || !found?.targets.length || videoMs?.supported === false) {
    return;
  }

  return {
    video: video && copyPlan(video, videoMs),
    audio: { index: audio.stream.Index ?? -1, action: 'transcode', targets: found.targets },
    smooth: (videoMs?.smooth ?? true) && found.smooth,
    verified: videoMs?.verified ?? true
  };
}

/**
 * Video transcode: the video is encoded; the audio is copied when it plays through media source playback
 */
async function planTranscodeVideo(evaluation: Evaluation): Promise<RungPlan | undefined> {
  const { video, audio, audioMs } = evaluation;
  const found = await evaluation.videoTargets();

  if (!video || !found?.targets.length) {
    return;
  }

  const videoPlan: StreamPlan = { index: video.stream.Index ?? -1, action: 'transcode', targets: found.targets };

  if (!audio || audioMs?.supported) {
    return {
      video: videoPlan,
      audio: audio && copyPlan(audio, audioMs),
      smooth: found.smooth && (audioMs?.smooth ?? true),
      verified: audioMs?.verified ?? true
    };
  }

  const foundAudio = await evaluation.audioTargets();

  if (!foundAudio?.targets.length) {
    return;
  }

  return {
    video: videoPlan,
    audio: { index: audio.stream.Index ?? -1, action: 'transcode', targets: foundAudio.targets },
    smooth: found.smooth && foundAudio.smooth,
    verified: true
  };
}

/**
 * How a rung would play, if the browser can decode what it needs
 */
async function getPlan(evaluation: Evaluation, rung: PlaybackRung): Promise<RungPlan | undefined> {
  switch (rung) {
    case 'DirectPlay': {
      return planCopy(evaluation, evaluation.videoFile, evaluation.audioFile);
    }
    case 'Remux': {
      return planCopy(evaluation, evaluation.videoMs, evaluation.audioMs);
    }
    case 'TranscodeAudio': {
      return planTranscodeAudio(evaluation);
    }
    case 'TranscodeVideo': {
      return planTranscodeVideo(evaluation);
    }
  }
}

/**
 * Adds the fallback targets to the copied streams of a video's plan (see {@link StreamPlan}). Music has none, except
 * for a track nobody could check: a direct play of it falls back to the preferred target (see `device-profile.ts`).
 */
async function withFallbacks(evaluation: Evaluation, plan: RungPlan): Promise<Pick<RungPlan, 'video' | 'audio'>> {
  const withFallback = async (stream: StreamPlan | undefined, findTargets: () => Promise<TargetSet | undefined>) => {
    const wanted = stream?.action === 'copy' && (plan.video !== undefined || stream.unverified === true);
    const targets = wanted ? (await findTargets())?.targets : undefined;

    return targets?.length ? { ...stream, fallback: targets } as StreamPlan : stream;
  };
  const [video, audio] = await Promise.all([
    withFallback(plan.video, evaluation.videoTargets),
    withFallback(plan.audio, evaluation.audioTargets)
  ]);

  return { video, audio };
}

/**
 * Why the quality mode or the user policy forbid a rung, if they do
 *
 * @param environment - The quality mode and the user policy
 * @param rung - The rung to check
 * @param streams - Whether the media has video, and whether the rung encodes the audio
 * @returns `quality`, `policy` or undefined when the rung is allowed
 */
export function getRungRejection(
  environment: Pick<VerdictEnvironment, 'quality' | 'policy'>,
  rung: PlaybackRung,
  streams: { readonly video: boolean; readonly encodesAudio: boolean }
): 'quality' | 'policy' | undefined {
  const { policy } = environment;

  if (environment.quality.type === 'original' && rung !== 'DirectPlay' && rung !== 'Remux') {
    return 'quality';
  }

  /**
   * Every rung above direct play goes through the server's HLS output, which the server only serves to users who
   * may transcode the item's media type: without that permission it answers a progressive stream in the source's
   * container instead, even for a remux (verified on Jellyfin 12.4)
   */
  const hlsAllowed = policy[streams.video ? 'EnableVideoPlaybackTranscoding' : 'EnableAudioPlaybackTranscoding'] !== false;
  const allowed = {
    DirectPlay: true,
    Remux: hlsAllowed && policy.EnablePlaybackRemuxing !== false,
    TranscodeAudio: hlsAllowed && policy.EnableAudioPlaybackTranscoding !== false,
    TranscodeVideo: policy.EnableVideoPlaybackTranscoding !== false
      && (!streams.encodesAudio || policy.EnableAudioPlaybackTranscoding !== false)
  }[rung];

  return allowed ? undefined : 'policy';
}

/**
 * Whether a rung is out of reach whatever it plays: every rung above direct play is delivered as the server's HLS
 * output, which the browser may not be able to play at all
 */
function getHlsRejection(environment: VerdictEnvironment, rung: PlaybackRung): 'hls' | undefined {
  return rung !== 'DirectPlay' && !environment.hlsDelivery ? 'hls' : undefined;
}

/**
 * A rung's plan, or why it is not chosen: out of reach without the server's HLS output (its plan is not even made, so
 * nothing about the output is asked), nothing the browser decodes, or forbidden by the quality mode or the user policy
 *
 * @param makePlan - Makes the rung's plan, undefined when the browser cannot decode what it needs
 */
async function considerRung(
  environment: VerdictEnvironment,
  rung: PlaybackRung,
  itemType: 'Video' | 'Audio',
  makePlan: () => Promise<RungPlan | undefined> | RungPlan | undefined
): Promise<{ readonly plan: RungPlan } | { readonly rejection: RungRejection }> {
  const unreachable = getHlsRejection(environment, rung);

  if (unreachable) {
    return { rejection: unreachable };
  }

  const plan = await makePlan();

  if (!plan) {
    return { rejection: 'browser' };
  }

  const rejection = getRejection(environment, rung, itemType, plan);

  return rejection ? { rejection } : { plan };
}

/**
 * What every verdict computed in an environment carries about it: whether only direct play exists
 */
function getDeliveryMarks(environment: VerdictEnvironment): Pick<Verdict, 'onlyDirectPlay'> {
  return environment.hlsDelivery ? {} : { onlyDirectPlay: true };
}

/**
 * Whether the quality mode or the user policy forbid a playable rung of an item of the given type
 */
function getRejection(environment: VerdictEnvironment, rung: PlaybackRung, itemType: 'Video' | 'Audio', plan: RungPlan): RungRejection | undefined {
  return getRungRejection(environment, rung, { video: itemType === 'Video', encodesAudio: plan.audio?.action === 'transcode' });
}

/**
 * The reasons that explain the rungs skipped on the way up
 */
function getRejectionReasons(rejections: Set<RungRejection>, unplayable: boolean): VerdictReason[] {
  const reasons: VerdictReason[] = [];

  if (rejections.has('quality')) {
    reasons.push('NotAllowedByQuality');
  }

  if (rejections.has('policy')) {
    reasons.push('NotAllowedByPolicy');
  }

  if (rejections.has('hls')) {
    reasons.push('NoHlsPlayback');
  }

  if (unplayable && rejections.size === 1 && rejections.has('browser')) {
    reasons.push('NoDecodableTarget');
  }

  return reasons;
}

/**
 * The source's quality, to break ties between versions
 */
function getQuality(evaluation: Evaluation): Verdict['quality'] {
  const { source } = evaluation.input;

  return {
    width: getKnownValue(evaluation.video?.stream.Width),
    height: getKnownValue(evaluation.video?.stream.Height),
    bitrate: getKnownValue(source.Bitrate) ?? getKnownValue(evaluation.video?.stream.BitRate) ?? getKnownValue(evaluation.audio?.stream.BitRate)
  };
}

/**
 * How a rung plays a source without stream metadata, if the browser decodes the targets it needs (see
 * {@link getBlindVerdict}). A copied stream nobody knows can only be listed through its targets, so every rung but
 * direct play needs them: an empty codec list would mean "anything" to the server.
 */
function getBlindPlan(rung: PlaybackRung, video: TargetSet | undefined, audio: TargetSet): RungPlan | undefined {
  const copy = (set: TargetSet | undefined): StreamPlan =>
    set?.targets.length ? { action: 'copy', fallback: set.targets, unverified: true } : { action: 'copy', unverified: true };
  const encode = (set: TargetSet): StreamPlan => ({ action: 'transcode', targets: set.targets });
  const videoListed = video === undefined || video.targets.length > 0;
  const audioListed = audio.targets.length > 0;

  switch (rung) {
    case 'DirectPlay': {
      // Music has no fallback: the server takes a single codec for it (see StreamPlan)
      return { video: video && copy(video), audio: video ? copy(audio) : { action: 'copy', unverified: true }, smooth: true, verified: false };
    }
    case 'Remux': {
      // Music skips it: its single codec would have to be the source's, which nobody can name
      return video && videoListed && audioListed ? { video: copy(video), audio: copy(audio), smooth: true, verified: false } : undefined;
    }
    case 'TranscodeAudio': {
      return videoListed && audioListed
        ? { video: video && copy(video), audio: encode(audio), smooth: audio.smooth, verified: false }
        : undefined;
    }
    case 'TranscodeVideo': {
      return video && videoListed && audioListed
        ? { video: encode(video), audio: encode(audio), smooth: video.smooth && audio.smooth, verified: false }
        : undefined;
    }
  }
}

/**
 * The rungs from `from` (included) to `to` (excluded) that exist for the media: without a video there is no video to
 * encode, so music has no video transcode (its ladder ends with the audio transcode)
 */
function getRungs(from: number, to: number, hasVideo: boolean): PlaybackRung[] {
  return PLAYBACK_RUNGS.slice(from, to).filter(rung => rung !== 'TranscodeVideo' || hasVideo);
}

/**
 * The verdict for a source without any stream metadata (live TV, .strm, remote). Nobody knows its streams: not this
 * client, and not the server until it opens or probes the source (Jellyfin 12.4 probes a .strm on every PlaybackInfo
 * request). It is played directly, blindly, and the failure ladder corrects it: the verdict starts at the learned
 * floor, and above direct play it offers the transcoding targets the browser decodes (the only questions there are to
 * ask) and lets the server decide:
 * - direct play: of whatever it is, with the targets as the server's fallback, like any direct play
 * - remux: both streams may be copied; the server copies the ones whose codec is a target and encodes the rest
 * - audio transcode: the audio is encoded, the video may still be copied
 * - video transcode: both are encoded, so no stream nobody checked is left: it is the last rung
 *
 * Music skips the remux (see {@link getBlindPlan}). The quality mode and the user policy limit the rungs as usual.
 */
async function getBlindVerdict(input: VerdictInput): Promise<Verdict> {
  const { source, oracle, environment } = input;
  const signature = `unverified:${source.Id ?? source.Path ?? ''}`;
  const floor = environment.getLearnedFloor(signature);
  const floorRung = floor === undefined ? 0 : getMethodOrder(floor);
  const qualityCap = input.mediaType === 'Audio'
    ? undefined
    : getRequestCaps(getTranscodeLevel(undefined, getModeLevel(environment.quality)));
  const [videoTargets, audioTargets] = await Promise.all([
    qualityCap && findVideoTargets(oracle, getVideoTargetParams(undefined, qualityCap), environment.hlsDelivery),
    // The source's channels are unknown: surround is kept if the browser accepts it, the server never upmixes
    findAudioTargets(oracle, MAX_TRANSCODE_AUDIO_CHANNELS, environment.hlsDelivery)
  ]);
  const common = {
    signature,
    unverified: true,
    quality: { bitrate: getKnownValue(source.Bitrate) },
    mediaType: getItemType(input, input.mediaType !== 'Audio'),
    ...getDeliveryMarks(environment)
  };
  const failedBefore: VerdictReason[] = floorRung > 0 ? ['FailedBefore'] : [];
  const rejections = new Set<RungRejection>();

  const rungs = getRungs(floorRung, PLAYBACK_RUNGS.length, qualityCap !== undefined);

  for (const rung of rungs) {
    const considered = await considerRung(environment, rung, common.mediaType, () => getBlindPlan(rung, videoTargets, audioTargets));

    if ('rejection' in considered) {
      rejections.add(considered.rejection);
      continue;
    }

    const { plan } = considered;

    return {
      ...common,
      method: rung,
      reasons: [...new Set<VerdictReason>([
        ...failedBefore,
        ...getRejectionReasons(rejections, false),
        ...(plan.smooth ? [] : ['NotSmooth' as const]),
        'Unverified'
      ])],
      smooth: plan.smooth,
      video: plan.video,
      audio: plan.audio,
      maxAudioChannels: plan.audio?.action === 'transcode' ? plan.audio.targets[0]?.channels : undefined,
      qualityCap: plan.video?.action === 'transcode' ? qualityCap : undefined
    };
  }

  return {
    ...common,
    method: 'Unplayable',
    reasons: [...new Set<VerdictReason>([...failedBefore, ...getRejectionReasons(rejections, true), 'Unverified'])],
    smooth: false
  };
}

/**
 * Computes the verdict for one media source. See the module documentation for the rules.
 */
export async function computeVerdict(input: VerdictInput): Promise<Verdict> {
  const { source, environment } = input;
  const streams = source.MediaStreams ?? [];
  const videoStream = pickStream(streams, 'Video', input.videoStreamIndex);
  const audioStream = pickStream(streams, 'Audio', input.audioStreamIndex, source.DefaultAudioStreamIndex);

  if (!videoStream && !audioStream) {
    return getBlindVerdict(input);
  }

  const evaluation = await evaluateSource(input, videoStream, audioStream);
  const { minRung, reasons } = getRequirements(evaluation);
  const common = {
    subtitle: evaluation.subtitle,
    signature: evaluation.signature,
    codecs: evaluation.codecs,
    quality: getQuality(evaluation),
    mediaType: getItemType(input, videoStream !== undefined),
    ...getDeliveryMarks(environment)
  };
  const rejections = new Set<RungRejection>();

  const rungs = getRungs(minRung, PLAYBACK_RUNGS.length, evaluation.video !== undefined);

  for (const rung of rungs) {
    const considered = await considerRung(environment, rung, common.mediaType, async () => getPlan(evaluation, rung));

    if ('rejection' in considered) {
      rejections.add(considered.rejection);
      continue;
    }

    const { plan } = considered;

    const unverified = !plan.verified;
    const { video, audio } = await withFallbacks(evaluation, plan);
    const finalReasons: VerdictReason[] = [
      ...reasons,
      ...getRejectionReasons(rejections, false),
      ...(plan.smooth ? [] : ['NotSmooth' as const]),
      ...(unverified ? ['Unverified' as const] : [])
    ];

    return {
      ...common,
      method: rung,
      reasons: [...new Set(finalReasons)],
      smooth: plan.smooth,
      unverified,
      video,
      audio,
      maxAudioChannels: plan.audio?.action === 'transcode' ? plan.audio.targets[0]?.channels : undefined,
      qualityCap: plan.video?.action === 'transcode' ? evaluation.qualityCap : undefined
    };
  }

  return {
    ...common,
    method: 'Unplayable',
    reasons: [...new Set([...reasons, ...getRejectionReasons(rejections, true)])],
    smooth: false,
    // Nothing that plays was found even assuming the unchecked streams play
    unverified: [evaluation.videoFile, evaluation.videoMs, evaluation.audioFile, evaluation.audioMs]
      .some(support => support?.verified === false && support.supported)
  };
}
