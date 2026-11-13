/**
 * How a verdict is told to the user: the method in words and the one reason that explains it.
 *
 * A verdict can carry several reasons; the label shows the one that requires the chosen method (the codec before the
 * user's own choices), then what pushed it above its requirements (a learned failure, the user policy), and only when
 * nothing else applies, that the browser says it will not play smoothly. Codec and container names are the server's.
 * A prediction that relies on streams nobody could check (an unverified verdict) is told as an attempt.
 */
import type { MediaSourceInfo, MediaStream } from '@jellyfin/sdk/lib/generated-client';
import type { PlaybackMethod, PlaybackRung, Verdict, VerdictReason } from './verdict.ts';

/**
 * The method in words. A video transcode that also encodes the audio is told apart.
 */
export type MethodLabel = PlaybackMethod | 'TranscodeVideoAndAudio';

/**
 * The reason in words:
 * - `ContainerUnsupported`: the browser cannot open the file's container (`values.container`)
 * - `CodecUnsupported`: the browser cannot play a codec (`values.codec`)
 * - `CodecsUnsupported`: the browser plays neither the video nor the audio codec (`values.video`, `values.audio`)
 * - `HdrOnSdrDisplay`, `SubtitleBurnIn`, `ExceedsQuality`, `SecondaryAudioTrack`, `ExternalAudioTrack`, `NotSmooth`,
 * `NotAllowedByQuality`, `NoDecodableTarget`, `NoHlsPlayback`: as the verdict's reason of the same name
 * - `FailedBefore`: a cheaper method did not work; `NothingWorked`: no method did
 * - `PolicySimplerMethod`: the user policy forbids a cheaper method; `PolicyNeededMethod`: the one it needs
 */
export type ReasonLabel
  = | 'ContainerUnsupported'
    | 'CodecUnsupported'
    | 'CodecsUnsupported'
    | 'HdrOnSdrDisplay'
    | 'SubtitleBurnIn'
    | 'ExceedsQuality'
    | 'SecondaryAudioTrack'
    | 'ExternalAudioTrack'
    | 'FailedBefore'
    | 'NothingWorked'
    | 'NotSmooth'
    | 'NotAllowedByQuality'
    | 'PolicySimplerMethod'
    | 'PolicyNeededMethod'
    | 'NoDecodableTarget'
    | 'NoHlsPlayback';

export interface VerdictLabel {
  readonly method: MethodLabel;
  readonly reason?: ReasonLabel;
  /**
   * The names the reason mentions
   */
  readonly values?: Readonly<Record<string, string>>;
  /**
   * The method is an attempt, not a certainty: the prediction relies on streams nobody could check
   */
  readonly attempt?: true;
}

/**
 * The rung each requirement asks for, in the order they explain a method: what the file is before what the user
 * chose
 */
const REQUIREMENTS: readonly (readonly [VerdictReason, PlaybackRung])[] = [
  ['VideoCodecUnsupported', 'TranscodeVideo'],
  ['AudioCodecUnsupported', 'TranscodeAudio'],
  ['HdrOnSdrDisplay', 'TranscodeVideo'],
  ['SubtitleBurnIn', 'TranscodeVideo'],
  ['ExceedsQuality', 'TranscodeVideo'],
  ['ContainerUnsupported', 'Remux'],
  ['ExternalAudioTrack', 'Remux'],
  ['SecondaryAudioTrack', 'Remux']
];

/**
 * Why nothing can play it, from the most to the least actionable. A browser that only plays files directly comes
 * first: no other choice of quality or policy would change it.
 */
const UNPLAYABLE_REASONS: readonly (readonly [VerdictReason, ReasonLabel])[] = [
  ['NoHlsPlayback', 'NoHlsPlayback'],
  ['NotAllowedByQuality', 'NotAllowedByQuality'],
  ['NotAllowedByPolicy', 'PolicyNeededMethod'],
  ['NoDecodableTarget', 'NoDecodableTarget'],
  ['FailedBefore', 'NothingWorked']
];

/**
 * What pushes a playable method above what the streams require
 */
const ESCALATIONS: readonly (readonly [VerdictReason, ReasonLabel])[] = [
  ['FailedBefore', 'FailedBefore'],
  ['NotAllowedByPolicy', 'PolicySimplerMethod']
];

/**
 * The stream a plan refers to or, without a plan (an unplayable verdict), the source's default one of that type
 */
function getStream(source: MediaSourceInfo, type: 'Video' | 'Audio', index: number | undefined): MediaStream | undefined {
  const ofType = source.MediaStreams?.filter(stream => stream.Type === type) ?? [];
  const wanted = index ?? (type === 'Audio' ? source.DefaultAudioStreamIndex : undefined);

  return ofType.find(stream => stream.Index === wanted) ?? (index === undefined ? ofType[0] : undefined);
}

/**
 * The codec of the stream, as the server names it
 */
function getCodec(source: MediaSourceInfo, verdict: Verdict, type: 'Video' | 'Audio'): string | undefined {
  const plan = type === 'Video' ? verdict.video : verdict.audio;

  return getStream(source, type, plan?.index)?.Codec?.toUpperCase();
}

/**
 * A requirement in words, if it can be told (a codec the server does not name cannot)
 */
function describeRequirement(reason: VerdictReason, verdict: Verdict, source: MediaSourceInfo): Omit<VerdictLabel, 'method'> | undefined {
  switch (reason) {
    case 'VideoCodecUnsupported':
    case 'AudioCodecUnsupported': {
      const video = getCodec(source, verdict, 'Video');
      const audio = getCodec(source, verdict, 'Audio');
      const both = verdict.reasons.includes('VideoCodecUnsupported') && verdict.reasons.includes('AudioCodecUnsupported');

      if (both && verdict.method === 'TranscodeVideo' && video && audio) {
        return { reason: 'CodecsUnsupported', values: { video, audio } };
      }

      const codec = reason === 'VideoCodecUnsupported' ? video : audio;

      return codec ? { reason: 'CodecUnsupported', values: { codec } } : undefined;
    }
    case 'ContainerUnsupported': {
      return source.Container ? { reason: 'ContainerUnsupported', values: { container: source.Container.toUpperCase() } } : undefined;
    }
    case 'HdrOnSdrDisplay':
    case 'SubtitleBurnIn':
    case 'ExceedsQuality':
    case 'ExternalAudioTrack':
    case 'SecondaryAudioTrack': {
      return { reason };
    }
    default: {
      return undefined;
    }
  }
}

/**
 * The first requirement in words that asks for exactly the method (any method, for an unplayable verdict)
 */
function findRequirement(verdict: Verdict, source: MediaSourceInfo): Omit<VerdictLabel, 'method'> | undefined {
  for (const [reason, rung] of REQUIREMENTS) {
    const explains = verdict.reasons.includes(reason) && (verdict.method === 'Unplayable' || verdict.method === rung);
    const described = explains ? describeRequirement(reason, verdict, source) : undefined;

    if (described) {
      return described;
    }
  }
}

/**
 * The first reason of a list the verdict carries
 */
function findReason(verdict: Verdict, list: readonly (readonly [VerdictReason, ReasonLabel])[]): ReasonLabel | undefined {
  return list.find(([reason]) => verdict.reasons.includes(reason))?.[1];
}

/**
 * The reason of a verdict in words, if one explains it
 */
function getReason(verdict: Verdict, source: MediaSourceInfo): Omit<VerdictLabel, 'method'> | undefined {
  if (verdict.method === 'Unplayable') {
    const reason = findReason(verdict, UNPLAYABLE_REASONS);

    return reason ? { reason } : findRequirement(verdict, source);
  }

  const requirement = findRequirement(verdict, source);

  if (requirement) {
    return requirement;
  }

  const reason = findReason(verdict, ESCALATIONS) ?? (verdict.reasons.includes('NotSmooth') ? 'NotSmooth' : undefined);

  return reason ? { reason } : undefined;
}

/**
 * A change of method, as the user sees it: the label of the method that played and of the one that plays now
 */
export interface MethodChange {
  readonly from: MethodLabel;
  readonly to: MethodLabel;
}

/**
 * Whether a failure changed the method the user sees, compared by label, not by the server's method: a video transcode
 * that starts encoding the audio too is a change. The method-change notice and the playback statistics' last change
 * both take it from here, so one is never shown without the other.
 *
 * @param from - The label of the method that failed
 * @param to - The label of the method negotiated after the failure
 * @returns The change, or undefined when the label is the same
 */
export function getMethodChange(from: MethodLabel, to: MethodLabel): MethodChange | undefined {
  return from === to ? undefined : { from, to };
}

/**
 * Why the server's answer for a playback is not played: it plays nothing (`unplayable`), or it encodes something,
 * which quality mode Original forbids (`quality`)
 */
export type PlaybackFailure = 'unplayable' | 'quality';

/**
 * The label of a verdict: the method in words and the reason that explains it
 *
 * @param verdict - How this client would play the source
 * @param source - The media source the verdict was computed for, which names the codecs and the container
 * @param actualMethod - The method the server chose for it, when it is being played. When it differs from the
 * verdict's, the verdict's reasons do not explain it, so none is given. Either way it is what plays, no attempt.
 * @param failure - Why the server's answer is not played, when it is not: then nothing plays, whatever the server
 * chose, and the label says so with the failure's reason
 */
export function getVerdictLabel(verdict: Verdict, source: MediaSourceInfo, actualMethod?: PlaybackMethod, failure?: PlaybackFailure): VerdictLabel {
  if (failure && actualMethod !== undefined && actualMethod !== 'Unplayable') {
    return { method: 'Unplayable', ...(failure === 'quality' && { reason: 'NotAllowedByQuality' as const }) };
  }

  if (actualMethod !== undefined && actualMethod !== verdict.method) {
    return { method: actualMethod };
  }

  const method: MethodLabel = verdict.method === 'TranscodeVideo' && verdict.audio?.action === 'transcode'
    ? 'TranscodeVideoAndAudio'
    : verdict.method;
  const reason = getReason(verdict, source);
  const attempt = verdict.unverified && actualMethod === undefined;

  return { method, ...reason, ...(attempt && { attempt }) };
}
