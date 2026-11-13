/**
 * Builds the questions for `navigator.mediaCapabilities.decodingInfo`: for one elementary stream of a media
 * source, an ordered list of candidate configurations. The stream counts as supported if the browser supports
 * any of them.
 *
 * The codec strings come from the file itself (mediabunny) whenever possible. The only transformations applied to
 * them are the normalisations listed in the plan (HEVC prefix, PCM, QuickTime as MP4) and the Dolby Vision string
 * built from the server's data. Without a usable string, a generic candidate is built from the server's names
 * (`avc1`, `h264`, `mp4a`, `aac`...), and marked as such: several of those names are complete codec strings (`flac`,
 * `opus`, `mp3`, `vp8`...), so a "supported" answer counts, but the browser cannot answer the others, so an
 * "unsupported" answer to a generic candidate is no evidence (see `verdict.ts`).
 */
import type { MediaSourceInfo, MediaStream, VideoRangeType } from '@jellyfin/sdk/lib/generated-client';
import { FALLBACK_BITRATE, FALLBACK_FRAME_RATE, type TranscodeTarget } from './constants.ts';
import type { ProbedTrack } from './probe.ts';

/**
 * How the stream would reach the media element:
 * - `file`: the original file, played directly
 * - `media-source`: through hls.js, as fragmented MP4 produced by the server
 */
export type DecodingMode = 'file' | 'media-source';

/**
 * Input of {@link getStreamCandidates}
 */
export interface StreamCandidatesInput {
  readonly source: MediaSourceInfo;
  /**
   * A video or audio stream of the source
   */
  readonly stream: MediaStream;
  /**
   * The track of the probe that corresponds to `stream`, if the probe found it
   */
  readonly probed?: ProbedTrack;
  /**
   * The probed container MIME type, without parameters
   */
  readonly containerMime?: string;
  /**
   * Whether the probed container's MIME type implies its codec (see `ProbeResult`)
   */
  readonly containerImpliesCodec?: boolean;
  readonly mode: DecodingMode;
}

/**
 * The HDR members of a `VideoConfiguration`
 */
export interface HdrFields {
  readonly transferFunction: TransferFunction;
  readonly colorGamut: ColorGamut;
  readonly hdrMetadataType?: HdrMetadataType;
}

/**
 * Output parameters of a video transcoding target
 */
export interface VideoTargetParams {
  readonly width: number;
  readonly height: number;
  readonly bitrate: number;
  readonly framerate: number;
}

/**
 * Output parameters of an audio transcoding target
 */
export interface AudioTargetParams {
  readonly channels: number;
  readonly samplerate?: number;
}

type StreamKind = 'video' | 'audio';

/**
 * A stream property (channels, sample rate, frame rate, bitrate, width, height) when it is known: a positive number.
 * The server and the probe report 0, a negative number or nothing for what they do not know.
 */
export function getKnownValue(value: number | null | undefined): number | undefined {
  return typeof value === 'number' && value > 0 ? value : undefined;
}

/**
 * == COLOUR METADATA -> HDR FIELDS (item 5 of the plan's fixed inventory) ==
 *
 * Vocabularies: mediabunny uses WebCodecs names (`pq`, `hlg`, `bt2020`, `smpte432`...), the server uses
 * FFmpeg names (`smpte2084`, `arib-std-b67`, `bt2020`...) and its own `VideoRangeType`.
 */
const TRANSFER_FUNCTIONS: Readonly<Record<string, TransferFunction>> = {
  'pq': 'pq',
  'hlg': 'hlg',
  'smpte2084': 'pq',
  'arib-std-b67': 'hlg'
};

const COLOR_GAMUTS: Readonly<Record<string, ColorGamut>> = {
  bt2020: 'rec2020',
  smpte431: 'p3',
  smpte432: 'p3',
  bt709: 'srgb'
};

/**
 * How each range type is evaluated: through the transfer function of the layer the browser decodes,
 * and the HDR metadata it carries. `undefined` means the range type says nothing and the colour data decides.
 * Dolby Vision without a compatible base layer (`DOVI`) is handled separately.
 */
const RANGE_TYPES: Readonly<Partial<Record<VideoRangeType, { transfer?: TransferFunction; metadata?: HdrMetadataType }>>> = {
  SDR: {},
  DOVIWithSDR: {},
  HDR10: { transfer: 'pq', metadata: 'smpteSt2086' },
  DOVIWithHDR10: { transfer: 'pq', metadata: 'smpteSt2086' },
  DOVIWithEL: { transfer: 'pq', metadata: 'smpteSt2086' },
  HDR10Plus: { transfer: 'pq', metadata: 'smpteSt2094-40' },
  DOVIWithHDR10Plus: { transfer: 'pq', metadata: 'smpteSt2094-40' },
  DOVIWithELHDR10Plus: { transfer: 'pq', metadata: 'smpteSt2094-40' },
  HLG: { transfer: 'hlg' },
  DOVIWithHLG: { transfer: 'hlg' }
};

/**
 * HDR10+ is HDR10 (PQ, BT.2020 and the static metadata of SMPTE ST 2086) with the dynamic metadata of SMPTE ST 2094-40
 * added in messages a decoder that does not take them ignores, so a browser that plays the HDR10 video plays it, as
 * HDR10. Dolby Vision with an HDR10+ base layer carries the same layer. Dolby Vision without a compatible base layer
 * (`DOVI`) has none: it is asked only as Dolby Vision.
 */
const STATIC_BASE_LAYER_METADATA: Readonly<Partial<Record<HdrMetadataType, HdrMetadataType>>> = {
  'smpteSt2094-40': 'smpteSt2086'
};

/**
 * Whether the video is Dolby Vision without a base layer other decoders understand
 * (profile 5, profile 10.0): it is only playable as Dolby Vision.
 */
export function isDolbyVisionOnly(stream: MediaStream): boolean {
  return stream.VideoRangeType === 'DOVI';
}

/**
 * The HDR members of the query for a video stream, or undefined for SDR video.
 * The probed colour space comes first; the server's colour fields and range type complete what it lacks.
 */
export function getHdrFields(stream: MediaStream, probed?: ProbedTrack): HdrFields | undefined {
  const probedColor = probed?.type === 'video' ? probed.colorSpace : undefined;
  const gamut = COLOR_GAMUTS[probedColor?.primaries ?? ''] ?? COLOR_GAMUTS[stream.ColorPrimaries ?? ''];

  if (isDolbyVisionOnly(stream)) {
    return { transferFunction: 'pq', colorGamut: gamut ?? 'rec2020', hdrMetadataType: 'smpteSt2094-10' };
  }

  const range = stream.VideoRangeType ? RANGE_TYPES[stream.VideoRangeType] : undefined;
  let transfer: TransferFunction | undefined;

  if (probedColor?.transfer) {
    transfer = TRANSFER_FUNCTIONS[probedColor.transfer];
  } else if (stream.ColorTransfer) {
    transfer = TRANSFER_FUNCTIONS[stream.ColorTransfer];
  } else {
    transfer = range?.transfer;
  }

  if (!transfer) {
    return;
  }

  const metadata = range?.transfer === transfer ? range.metadata : undefined;

  return {
    transferFunction: transfer,
    // HDR10 and HLG are both defined on BT.2020 primaries
    colorGamut: gamut ?? 'rec2020',
    ...(metadata && { hdrMetadataType: metadata })
  };
}

/**
 * == CONTAINERS ==
 */

/**
 * Splits a MIME type into its subtype, ignoring the top-level type and any parameter
 */
function getSubtype(mime: string): string | undefined {
  const subtype = mime.split(';', 1)[0]?.split('/', 2)[1]?.trim().toLowerCase();

  return subtype === '' ? undefined : subtype;
}

/**
 * The container MIME types to ask with. The configuration of an audio stream must use the audio top-level
 * type and a video stream the video one, whatever the file's own MIME type says.
 */
function getContainers(kind: StreamKind, input: StreamCandidatesInput): string[] {
  if (input.mode === 'media-source') {
    return [`${kind}/mp4`];
  }

  const probedSubtype = input.containerMime ? getSubtype(input.containerMime) : undefined;

  if (probedSubtype) {
    // Normalisation: QuickTime files are also tried as MP4
    return probedSubtype === 'quicktime'
      ? [`${kind}/quicktime`, `${kind}/mp4`]
      : [`${kind}/${probedSubtype}`];
  }

  const tokens = (input.source.Container ?? '')
    .split(',')
    .map(token => token.trim().toLowerCase())
    .filter(Boolean);

  return [...new Set(tokens)].map(token => `${kind}/${token}`);
}

/**
 * == CODEC STRINGS ==
 */

const HEVC_PREFIXES = ['hvc1', 'hev1'];

/**
 * Normalisation of HEVC strings: mediabunny always writes `hev1`, but the browser may answer differently
 * for `hvc1`. The prefix is taken from the file's sample entry when it has one; otherwise (Matroska, or the
 * container the server writes for media-source playback) both are asked, the file's first if known.
 */
function getHevcVariants(codecString: string, internalCodecId: ProbedTrack['internalCodecId'], mode: DecodingMode): string[] {
  const rest = codecString.slice(4);
  const filePrefix = typeof internalCodecId === 'string' && HEVC_PREFIXES.includes(internalCodecId)
    ? internalCodecId
    : undefined;

  if (filePrefix && mode === 'file') {
    return [filePrefix + rest];
  }

  const prefixes = filePrefix ? [filePrefix, ...HEVC_PREFIXES.filter(prefix => prefix !== filePrefix)] : HEVC_PREFIXES;

  return prefixes.map(prefix => prefix + rest);
}

/**
 * Normalisation of PCM: mediabunny's PCM strings are WebCodecs names, not MIME codecs values.
 * The container's own identifier is used instead when it is one: the WAVE format tag (RFC 2361) or the
 * MP4 sample entry fourcc. Anything else (Matroska `CodecID`s) goes to the generic candidate.
 */
function getPcmCodec(internalCodecId: ProbedTrack['internalCodecId']): string | undefined {
  if (typeof internalCodecId === 'number') {
    return String(internalCodecId);
  }

  if (typeof internalCodecId === 'string' && /^[\w ]{4}$/.test(internalCodecId)) {
    return internalCodecId;
  }
}

/**
 * The exact codec strings of a probed track, after normalisation. Undefined when there is no usable string.
 */
function getExactCodecs(probed: ProbedTrack | undefined, mode: DecodingMode): string[] | undefined {
  if (!probed?.codecString) {
    return;
  }

  if (probed.type === 'audio' && probed.pcm) {
    const pcm = getPcmCodec(probed.internalCodecId);

    return pcm ? [pcm] : undefined;
  }

  if (HEVC_PREFIXES.some(prefix => probed.codecString?.startsWith(`${prefix}.`))) {
    return getHevcVariants(probed.codecString, probed.internalCodecId, mode);
  }

  return [probed.codecString];
}

/**
 * Dolby Vision string, the only codec string formula of the engine: `<prefix>.<profile>.<level>`, both two
 * digits. The prefix is `dav1` for AV1, and for HEVC `dvh1` or `dvhe` after the file's sample entry
 * (both when the container has no fourcc).
 */
function getDolbyVisionCodecs(stream: MediaStream, probed?: ProbedTrack): string[] {
  if (typeof stream.DvProfile !== 'number' || typeof stream.DvLevel !== 'number') {
    return [];
  }

  const suffix = `.${String(stream.DvProfile).padStart(2, '0')}.${String(stream.DvLevel).padStart(2, '0')}`;

  if (stream.Codec?.toLowerCase() === 'av1') {
    return [`dav1${suffix}`];
  }

  const fourcc = (typeof probed?.internalCodecId === 'string' ? probed.internalCodecId : stream.CodecTag ?? '').toLowerCase();

  if (fourcc === 'dvh1' || fourcc === 'hvc1') {
    return [`dvh1${suffix}`];
  }

  if (fourcc === 'dvhe' || fourcc === 'hev1') {
    return [`dvhe${suffix}`];
  }

  return [`dvh1${suffix}`, `dvhe${suffix}`];
}

/**
 * Generic codecs values: the server's codec tag, then its codec name
 */
function getGenericCodecs(stream: MediaStream): string[] {
  const values = [stream.CodecTag, stream.Codec].filter((value): value is string => Boolean(value?.trim()));
  const seen = new Set<string>();

  return values.filter((value) => {
    const key = value.toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
}

/**
 * == CONFIGURATIONS ==
 */

/**
 * The `VideoConfiguration` members other than `contentType`, or undefined if the size is unknown
 * (`width` and `height` are required by the specification)
 */
function getVideoMembers(input: StreamCandidatesInput): Omit<VideoConfiguration, 'contentType'> | undefined {
  const { stream, source } = input;
  const probed = input.probed?.type === 'video' ? input.probed : undefined;
  const width = getKnownValue(stream.Width) ?? getKnownValue(probed?.width);
  const height = getKnownValue(stream.Height) ?? getKnownValue(probed?.height);

  if (!width || !height) {
    return;
  }

  return {
    width,
    height,
    bitrate: getKnownValue(stream.BitRate) ?? getKnownValue(source.Bitrate) ?? FALLBACK_BITRATE,
    framerate: getKnownValue(stream.RealFrameRate) ?? getKnownValue(stream.AverageFrameRate) ?? FALLBACK_FRAME_RATE,
    ...getHdrFields(stream, probed)
  };
}

/**
 * The `AudioConfiguration` members other than `contentType`. The bitrate is only sent when the stream
 * reports it: it is optional for audio and the source bitrate would describe the whole file.
 */
function getAudioMembers(input: StreamCandidatesInput): Omit<AudioConfiguration, 'contentType'> {
  const { stream } = input;
  const probed = input.probed?.type === 'audio' ? input.probed : undefined;
  const channels = getKnownValue(stream.Channels) ?? getKnownValue(probed?.channels);
  const samplerate = getKnownValue(stream.SampleRate) ?? getKnownValue(probed?.sampleRate);
  const bitrate = getKnownValue(stream.BitRate);

  return {
    ...(channels && { channels: String(channels) }),
    ...(samplerate && { samplerate }),
    ...(bitrate && { bitrate })
  };
}

/**
 * Where the codec strings of a stream come from:
 * - `file`: read from the file by the probe (after the normalisations)
 * - `formula`: the Dolby Vision string, complete, built from the server's profile and level
 * - `server`: the server's names, generic
 */
type CodecOrigin = 'file' | 'formula' | 'server';

/**
 * The codec strings of a stream, best first, and where they come from
 */
function getCodecChoice(input: StreamCandidatesInput): { codecs: string[]; origin: CodecOrigin } {
  const kind: StreamKind = input.stream.Type === 'Video' ? 'video' : 'audio';
  const probed = input.probed?.type === kind ? input.probed : undefined;

  /**
   * For Dolby Vision without a compatible base layer, the base layer string must not be offered:
   * it would be reported as supported and play with wrong colours
   */
  if (kind === 'video' && isDolbyVisionOnly(input.stream)) {
    return { codecs: getDolbyVisionCodecs(input.stream, probed), origin: 'formula' };
  }

  const exactCodecs = getExactCodecs(probed, input.mode);

  return exactCodecs ? { codecs: exactCodecs, origin: 'file' } : { codecs: getGenericCodecs(input.stream), origin: 'server' };
}

/**
 * The codec strings a stream is asked about, best first (see {@link getStreamCandidates})
 */
export function getStreamCodecStrings(input: StreamCandidatesInput): string[] {
  return getCodecChoice(input).codecs;
}

/**
 * One candidate configuration of a stream, and whether it is generic: built from the server's names instead of an
 * exact codec string (read from the file, or the Dolby Vision formula). The browser's "unsupported" answer to a generic
 * candidate is no evidence: it may only mean that the server's name is not a codec string.
 *
 * The candidates of one stream are all exact or all generic: generic candidates are only built when there is no exact
 * string, so an exact answer is never weighed against a generic one (exact answers always win).
 */
export interface StreamQuestion {
  readonly config: MediaDecodingConfiguration;
  readonly generic: boolean;
}

/**
 * Ordered candidate configurations for one video or audio stream, each marked generic or exact (see
 * {@link StreamQuestion}). Each one asks about exactly one codec of one stream (several codecs in `codecs` is a
 * `TypeError` by specification).
 *
 * An empty list means the stream cannot be asked about (not enough data): callers treat it as unverified.
 */
export function getStreamQuestions(input: StreamCandidatesInput): StreamQuestion[] {
  const kind: StreamKind = input.stream.Type === 'Video' ? 'video' : 'audio';
  const probed = input.probed?.type === kind ? input.probed : undefined;
  const { codecs, origin } = getCodecChoice(input);
  const generic = origin === 'server';
  const containers = getContainers(kind, input);
  const contentTypes = containers.flatMap(container => codecs.map(codec => `${container}; codecs="${codec}"`));

  /**
   * A container whose MIME type implies its codec must be asked without parameters (Media Capabilities, and
   * Chromium enforces it): the bare container MIME goes after the exact candidate. Only with an exact candidate read
   * from the file, only for the file itself.
   */
  if (input.mode === 'file' && input.containerImpliesCodec && origin === 'file') {
    contentTypes.push(...containers);
  }

  if (kind === 'video') {
    const members = getVideoMembers({ ...input, probed });

    if (!members) {
      return [];
    }

    // A video whose dynamic HDR metadata the browser does not take is asked again with its base layer's static one
    const baseLayer = members.hdrMetadataType ? STATIC_BASE_LAYER_METADATA[members.hdrMetadataType] : undefined;
    const variants = baseLayer ? [members, { ...members, hdrMetadataType: baseLayer }] : [members];

    return contentTypes.flatMap(contentType =>
      variants.map(variant => ({ config: { type: input.mode, video: { contentType, ...variant } }, generic })));
  }

  const members = getAudioMembers({ ...input, probed });

  return contentTypes.map(contentType => ({ config: { type: input.mode, audio: { contentType, ...members } }, generic }));
}

/**
 * The candidate configurations of one video or audio stream, best first (see {@link getStreamQuestions})
 */
export function getStreamCandidates(input: StreamCandidatesInput): MediaDecodingConfiguration[] {
  return getStreamQuestions(input).map(question => question.config);
}

/**
 * The configuration that asks whether the browser can decode a video transcoding target, as it would arrive
 * through hls.js
 */
export function getVideoTargetCandidate(target: TranscodeTarget, params: VideoTargetParams): MediaDecodingConfiguration {
  return {
    type: 'media-source',
    video: { contentType: `video/mp4; codecs="${target.codecString}"`, ...params }
  };
}

/**
 * The configuration that asks whether the browser can decode an audio transcoding target, as it would arrive
 * through hls.js
 */
export function getAudioTargetCandidate(target: TranscodeTarget, params: AudioTargetParams): MediaDecodingConfiguration {
  return {
    type: 'media-source',
    audio: {
      contentType: `audio/mp4; codecs="${target.codecString}"`,
      channels: String(params.channels),
      ...(params.samplerate && { samplerate: params.samplerate })
    }
  };
}
