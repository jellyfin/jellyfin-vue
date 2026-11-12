/**
 * Turns a verdict into the `PlaybackInfo` request that makes the server do exactly that, and reads back what
 * the server actually chose.
 *
 * Server semantics this relies on (Jellyfin's `StreamBuilder` and `MediaInfoHelper`):
 * - codec and container lists are literal, case-insensitive, comma-separated tokens without aliases, and an
 * empty list means "anything": every list sent here is explicit
 * - a stream is copied when its codec is in the transcoding profile's list and copying is allowed; otherwise it
 * is encoded to the first codec of the list the server can encode
 * - `IsRequired: false` conditions pass when the value is unknown
 */
import type {
  CodecProfile,
  DeviceProfile,
  DlnaProfileType,
  MediaSourceInfo,
  MediaStream,
  PlaybackInfoDto,
  ProfileCondition,
  TranscodeReason,
  TranscodingProfile
} from '@jellyfin/sdk/lib/generated-client';
import { UNLIMITED_STREAMING_BITRATE } from './constants.ts';
import { getKnownValue } from './media-config.ts';
import type { RequestCaps } from './quality.ts';
import { getSubtitleProfiles, type SubtitleRenderer } from './subtitles.ts';
import type { PlaybackMethod, StreamPlan, Verdict } from './verdict.ts';

/**
 * The `PlaybackInfo` flags sent with the device profile
 */
export type PlaybackRequestOptions = Required<Pick<PlaybackInfoDto,
  | 'EnableDirectPlay'
  | 'EnableDirectStream'
  | 'EnableTranscoding'
  | 'AllowVideoStreamCopy'
  | 'AllowAudioStreamCopy'
  | 'MaxStreamingBitrate'
>> & Pick<PlaybackInfoDto, 'MaxAudioChannels' | 'AudioStreamIndex' | 'SubtitleStreamIndex' | 'MediaSourceId'>;

/**
 * What to send to `PlaybackInfo`: `{ ...options, DeviceProfile: deviceProfile }`
 */
export interface PlaybackRequest {
  readonly deviceProfile: DeviceProfile;
  readonly options: PlaybackRequestOptions;
}

/**
 * The server's reasons that mean the video is encoded (`StreamBuilder.VideoReasons`) plus the container bitrate
 * limit, which lowers the video bitrate
 */
const VIDEO_ENCODE_REASONS = new Set<TranscodeReason>([
  'VideoCodecNotSupported',
  'VideoResolutionNotSupported',
  'AnamorphicVideoNotSupported',
  'InterlacedVideoNotSupported',
  'VideoBitDepthNotSupported',
  'VideoBitrateNotSupported',
  'VideoFramerateNotSupported',
  'VideoLevelNotSupported',
  'RefFramesNotSupported',
  'VideoRangeTypeNotSupported',
  'VideoProfileNotSupported',
  'VideoRotationNotSupported',
  'SubtitleCodecNotSupported',
  'ContainerBitrateExceedsLimit'
]);

/**
 * The server's reasons that mean the audio is encoded. `SecondaryAudioNotSupported` and `AudioIsExternal`
 * are not among them: the server copies such audio when it can.
 */
const AUDIO_ENCODE_REASONS = new Set<TranscodeReason>([
  'AudioCodecNotSupported',
  'AudioBitrateNotSupported',
  'AudioChannelsNotSupported',
  'AudioProfileNotSupported',
  'AudioSampleRateNotSupported',
  'AudioBitDepthNotSupported'
]);

/**
 * Finds a stream of the source by type and absolute index
 */
function findStream(source: MediaSourceInfo, type: MediaStream['Type'], index: number | undefined): MediaStream | undefined {
  return source.MediaStreams?.find(stream => stream.Type === type && stream.Index === index);
}

/**
 * The codec list for a stream: the targets (in order) when it is encoded; when it is copied, the source codec
 * after its fallback targets, so that if the server refuses the copy it encodes to a codec the browser decodes
 * instead of the source's. With `single`, one codec: the preferred target, or the source codec.
 */
function getCodecList(plan: StreamPlan | undefined, stream: MediaStream | undefined, single = false): string {
  if (plan?.action === 'transcode') {
    return (single ? plan.targets.slice(0, 1) : plan.targets).map(target => target.codec).join(',');
  }

  const fallback = single ? [] : plan?.fallback?.map(target => target.codec) ?? [];

  return [...new Set([...fallback, stream?.Codec ?? ''])].filter(Boolean).join(',');
}

/**
 * Conditions that make the server encode at most at the quality cap, in SDR and 8 bit
 */
function getTargetConditions(caps: RequestCaps | undefined): ProfileCondition[] {
  const condition = (Property: ProfileCondition['Property'], Condition: ProfileCondition['Condition'], Value: string | number) =>
    ({ Condition, Property, Value: String(Value), IsRequired: false });

  return [
    condition('VideoRangeType', 'EqualsAny', 'SDR'),
    condition('VideoBitDepth', 'LessThanEqual', 8),
    ...(caps
      ? [
          condition('Width', 'LessThanEqual', caps.maxWidth),
          condition('Height', 'LessThanEqual', caps.maxHeight),
          condition('VideoBitrate', 'LessThanEqual', caps.maxBitrate)
        ]
      : [])
  ];
}

/**
 * The cap of the audio encoded while the video is copied: at most the source audio's bitrate, as a condition on each
 * audio target (`VideoAudio` profiles bind only the streams of their codec, so only the encode; a copied video is not
 * affected). Without a streaming limit (see {@link getMaxStreamingBitrate}) the server encodes at its own default
 * (measured on Jellyfin 12.4: AAC 5.1 at 640 kbit/s from an AC-3 at 384 kbit/s, which the limit of the source's bitrate
 * made 384 kbit/s); with the cap the encode never carries more than the source's audio did. A video transcode keeps its
 * streaming cap, which sizes the audio as before; music is encoded at the same bitrate either way (measured).
 */
function getAudioCapProfiles(verdict: Verdict, audio: MediaStream | undefined): CodecProfile[] {
  const bitrate = getKnownValue(audio?.BitRate);

  if (verdict.video?.action !== 'copy' || verdict.audio?.action !== 'transcode' || bitrate === undefined) {
    return [];
  }

  const condition: ProfileCondition = { Condition: 'LessThanEqual', Property: 'AudioBitrate', Value: String(bitrate), IsRequired: false };

  return verdict.audio.targets.map(target => ({ Type: 'VideoAudio', Codec: target.codec, Conditions: [condition] }));
}

/**
 * The codec profiles: limits for every video target when the video is encoded; when Dolby Vision without a
 * compatible base layer is copied, the declaration that the client supports it (otherwise the server would label
 * it as plain HEVC)
 */
function getCodecProfiles(verdict: Verdict, video: MediaStream | undefined): CodecProfile[] {
  if (verdict.video?.action === 'transcode') {
    const conditions = getTargetConditions(verdict.qualityCap);

    return verdict.video.targets.map(target => ({ Type: 'Video', Codec: target.codec, Conditions: conditions }));
  }

  if (video?.VideoRangeType === 'DOVI' && video.Codec) {
    return [{
      Type: 'Video',
      Codec: video.Codec,
      Conditions: [{ Condition: 'EqualsAny', Property: 'VideoRangeType', Value: 'DOVI', IsRequired: false }]
    }];
  }

  return [];
}

/**
 * The bitrate the server may stream at: the quality cap when the video is encoded, otherwise no limit
 * ({@link UNLIMITED_STREAMING_BITRATE}). The server holds a copied video to the streaming bitrate minus the audio's
 * and encodes it when it is above, without a reason, so any limit can turn a planned copy into an encode (measured on
 * Jellyfin 12.4: with the source's own bitrate, an audio transcode of HEVC + AC-3 5.1 got VideoBitrate=2891323 for a
 * 3147323 b/s video, because the AAC 5.1 it encodes takes 640 kbit/s where the AC-3 took 384; and a 59 Mbit/s remote
 * file of unknown bitrate remuxed under the 40 Mbit/s it assumes was encoded to H.264).
 */
function getMaxStreamingBitrate(verdict: Verdict): number {
  return verdict.video?.action === 'transcode' && verdict.qualityCap ? verdict.qualityCap.maxBitrate : UNLIMITED_STREAMING_BITRATE;
}

/**
 * Builds the `PlaybackInfo` request that makes the server play the source the way the verdict says
 *
 * @param verdict - The verdict for the source, computed with the same tracks
 * @param source - The media source the verdict is about
 * @param renderers - The subtitle renderer registry the verdict was computed with
 */
export function buildPlaybackRequest(
  verdict: Verdict,
  source: MediaSourceInfo,
  renderers: readonly SubtitleRenderer[]
): PlaybackRequest {
  const video = verdict.video ? findStream(source, 'Video', verdict.video.index) : undefined;
  const audio = verdict.audio ? findStream(source, 'Audio', verdict.audio.index) : undefined;
  // The server matches an item only with profiles of its own type, whatever its streams (see Verdict.mediaType)
  const type: DlnaProfileType = verdict.mediaType ?? (verdict.video ? 'Video' : 'Audio');
  const method: PlaybackMethod = verdict.method;
  const playable = method !== 'Unplayable';
  const encodesAudio = verdict.audio?.action === 'transcode';
  const maxAudioChannels = encodesAudio ? verdict.maxAudioChannels : undefined;
  const transcodingProfile: TranscodingProfile = {
    Type: type,
    Context: 'Streaming',
    Protocol: 'hls',
    Container: 'mp4',
    ...(verdict.video && { VideoCodec: getCodecList(verdict.video, video) }),
    /**
     * Pure audio transcoding takes a single codec: the server checks it can encode to the profile's whole
     * `AudioCodec` value and skips the profile otherwise (`StreamBuilder.GetOptimalAudioStream`). A video item, even
     * without a video stream, is built as a video, which takes a list.
     */
    AudioCodec: getCodecList(verdict.audio, audio, type === 'Audio'),
    ...(maxAudioChannels !== undefined && { MaxAudioChannels: String(maxAudioChannels) })
  };
  const directPlayProfile = {
    Type: type,
    Container: source.Container ?? '',
    ...(video?.Codec && { VideoCodec: video.Codec }),
    ...(audio?.Codec && { AudioCodec: audio.Codec })
  };
  const maxStreamingBitrate = getMaxStreamingBitrate(verdict);

  return {
    deviceProfile: {
      MaxStreamingBitrate: maxStreamingBitrate,
      DirectPlayProfiles: method === 'DirectPlay' ? [directPlayProfile] : [],
      TranscodingProfiles: playable ? [transcodingProfile] : [],
      ContainerProfiles: [],
      CodecProfiles: [...getCodecProfiles(verdict, video), ...getAudioCapProfiles(verdict, audio)],
      SubtitleProfiles: getSubtitleProfiles(renderers)
    },
    options: {
      EnableDirectPlay: method === 'DirectPlay',
      // A progressive remux seeks badly: remuxes go through HLS
      EnableDirectStream: false,
      EnableTranscoding: playable,
      AllowVideoStreamCopy: verdict.video?.action !== 'transcode',
      AllowAudioStreamCopy: !encodesAudio,
      MaxStreamingBitrate: maxStreamingBitrate,
      MaxAudioChannels: maxAudioChannels,
      AudioStreamIndex: verdict.audio?.index,
      SubtitleStreamIndex: verdict.subtitle?.index ?? -1,
      MediaSourceId: source.Id
    }
  };
}

/**
 * The request for a source without any stream metadata (live TV, .strm, remote): direct play of whatever it is.
 * If that fails at runtime, the playback ladder moves on.
 *
 * @param source - The media source
 * @param type - The item's media type: the server only matches direct play profiles of the item's type
 * @param renderers - The subtitle renderer registry
 */
export function buildOptimisticRequest(
  source: MediaSourceInfo,
  type: Extract<DlnaProfileType, 'Video' | 'Audio'>,
  renderers: readonly SubtitleRenderer[]
): PlaybackRequest {
  const maxStreamingBitrate = UNLIMITED_STREAMING_BITRATE;

  return {
    deviceProfile: {
      MaxStreamingBitrate: maxStreamingBitrate,
      DirectPlayProfiles: [{ Type: type, Container: source.Container ?? '' }],
      TranscodingProfiles: [],
      ContainerProfiles: [],
      CodecProfiles: [],
      SubtitleProfiles: getSubtitleProfiles(renderers)
    },
    options: {
      EnableDirectPlay: true,
      EnableDirectStream: false,
      EnableTranscoding: false,
      AllowVideoStreamCopy: true,
      AllowAudioStreamCopy: true,
      MaxStreamingBitrate: maxStreamingBitrate,
      MediaSourceId: source.Id
    }
  };
}

/**
 * Reads the query of a transcoding URL with case-insensitive parameter names
 */
function readQuery(transcodingUrl: string): (name: string) => string | undefined {
  const query = new Map<string, string>();
  const search = transcodingUrl.includes('?') ? transcodingUrl.slice(transcodingUrl.indexOf('?') + 1) : '';

  const params = new URLSearchParams(search);

  for (const [name, value] of params) {
    query.set(name.toLowerCase(), value);
  }

  return name => query.get(name.toLowerCase());
}

/**
 * Splits a comma-separated list, lowercased
 */
function splitList(value: string | undefined): string[] {
  return (value ?? '').split(',').map(item => item.trim().toLowerCase()).filter(Boolean);
}

/**
 * The audio stream the server streams: the URL's audio index, else the source's default, else its first audio
 * stream (music transcoding URLs carry no audio index)
 */
function getNegotiatedAudio(negotiated: MediaSourceInfo, urlIndex: string | undefined): MediaStream | undefined {
  const index = urlIndex === undefined ? negotiated.DefaultAudioStreamIndex : Number(urlIndex);

  return typeof index === 'number'
    ? findStream(negotiated, 'Audio', index)
    : negotiated.MediaStreams?.find(stream => stream.Type === 'Audio');
}

/**
 * Whether a number from the URL is a limit below the stream's own value (both known)
 */
function isBelow(limit: string | undefined, value: number | null | undefined): boolean {
  const parsed = Number(limit);

  return limit !== undefined && Number.isFinite(parsed) && parsed > 0 && typeof value === 'number' && value > parsed;
}

/**
 * Whether the server limits the video below what the stream is, which it can only do by encoding it, even with its
 * codec listed and no reason given (`EncodingHelper.CanStreamCopyVideo`; measured on Jellyfin 12.4: a 59 Mbit/s
 * remote file remuxed under a 40 Mbit/s limit got `VideoBitrate=39871989`, a 10-bit H.264 file under an `h264` bit
 * depth condition got `h264-videobitdepth=8`, both with only `DirectPlayError`, and ffmpeg encoded both to 8-bit
 * H.264). The server also states the source's own values for its codec on a copy, which are no limit.
 */
function isVideoLimited(query: (name: string) => string | undefined, video: MediaStream): boolean {
  const codec = video.Codec?.toLowerCase();

  return isBelow(query('VideoBitrate'), video.BitRate)
    || (codec !== undefined && isBelow(query(`${codec}-videobitdepth`), video.BitDepth));
}

/**
 * The method the server actually chose, read from the negotiated media source of a `PlaybackInfo` answer:
 * `SupportsDirectPlay`, and otherwise the parameters of `TranscodingUrl` (codec lists, copy flags, burnt-in
 * subtitles, limits below the source's own values and `TranscodeReasons`).
 */
export function deriveActualMethod(negotiated: MediaSourceInfo): PlaybackMethod {
  if (negotiated.SupportsDirectPlay) {
    return 'DirectPlay';
  }

  if (!negotiated.TranscodingUrl) {
    return 'Unplayable';
  }

  const query = readQuery(negotiated.TranscodingUrl);
  const reasons = new Set(splitList(query('TranscodeReasons')));
  const hasReason = (set: Set<TranscodeReason>) => [...set].some(reason => reasons.has(reason.toLowerCase()));
  const video = negotiated.MediaStreams?.find(stream => stream.Type === 'Video');
  const audio = getNegotiatedAudio(negotiated, query('AudioStreamIndex'));
  // The server adds SubtitleMethod=Encode whenever a subtitle index is requested, even -1: only a real index burns
  const burnsSubtitle = Number(query('SubtitleStreamIndex') ?? -1) >= 0 && query('SubtitleMethod')?.toLowerCase() === 'encode';
  const videoEncoded = video !== undefined && (
    query('allowVideoStreamCopy')?.toLowerCase() === 'false'
    || !splitList(query('VideoCodec')).includes(video.Codec?.toLowerCase() ?? '')
    || burnsSubtitle
    || hasReason(VIDEO_ENCODE_REASONS)
    || isVideoLimited(query, video)
  );

  if (videoEncoded) {
    return 'TranscodeVideo';
  }

  /**
   * For audio items the server lists every reason direct play failed for, even when it copies the audio
   * (measured on Jellyfin 12.4), so only the codec list and the copy flag count there.
   *
   * For a video, the server also refuses to copy audio above the URL's audio bitrate, which it caps by the total
   * bitrate, without listing a reason (`EncodingHelper.CanStreamCopyAudio`; measured on Jellyfin 12.4: FLAC at
   * 960 kbit/s and DTS at 768 kbit/s were encoded to AAC with `AudioBitrate=384000`).
   */
  const urlAudioBitrate = Number(query('AudioBitrate'));
  const audioAboveBitrate = video !== undefined && typeof audio?.BitRate === 'number'
    && Number.isFinite(urlAudioBitrate) && urlAudioBitrate > 0 && audio.BitRate > urlAudioBitrate;
  const audioEncoded = audio !== undefined && (
    query('allowAudioStreamCopy')?.toLowerCase() === 'false'
    || !splitList(query('AudioCodec')).includes(audio.Codec?.toLowerCase() ?? '')
    || (video !== undefined && hasReason(AUDIO_ENCODE_REASONS))
    || audioAboveBitrate
  );

  return audioEncoded ? 'TranscodeAudio' : 'Remux';
}
