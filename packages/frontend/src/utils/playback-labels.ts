/**
 * Names of the playback methods, of the qualities and of the reasons of a change, for the version selector, the notices,
 * the quality menu, the settings page and the playback statistics. The translation function is passed in, so
 * components keep their reactive one.
 */
import type { MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client';
import type { PlaybackChangeReason } from '#/store/playback-quality.ts';
import type { QualityMenuEntry } from '#/utils/playback-capabilities/quality.ts';
import { getVerdictLabel, type MethodLabel, type PlaybackFailure, type VerdictLabel } from '#/utils/playback-capabilities/verdict-label.ts';
import type { PlaybackMethod, Verdict } from '#/utils/playback-capabilities/verdict.ts';

type Translate = (key: string, options?: Record<string, unknown>) => string;

/**
 * The name of a playback method: the one place that names it, for the version selector, the method-change notice, the
 * quality menu and the playback statistics
 */
export function getPlaybackMethodName(t: Translate, method: MethodLabel): string {
  switch (method) {
    case 'DirectPlay': {
      return t('playbackMethodDirectPlay');
    }
    case 'Remux': {
      return t('playbackMethodRemux');
    }
    case 'TranscodeAudio': {
      return t('playbackMethodTranscodeAudio');
    }
    case 'TranscodeVideo': {
      return t('playbackMethodTranscodeVideo');
    }
    case 'TranscodeVideoAndAudio': {
      return t('playbackMethodTranscodeVideoAndAudio');
    }
    case 'Unplayable': {
      return t('playbackMethodUnplayable');
    }
  }
}

/**
 * The name of a label's method, told as an attempt when the label is one (a prediction that relies on streams nobody
 * could check, see `getVerdictLabel`): the one place that says so, for the version selector and the playback statistics
 */
export function getLabelMethodName(t: Translate, label: VerdictLabel): string {
  const method = getPlaybackMethodName(t, label.method);

  return label.attempt ? t('playbackMethodAttempt', { method }) : method;
}

/**
 * The reason of a label in words, if it has one
 */
export function getLabelReasonName(t: Translate, { reason, values = {} }: VerdictLabel): string | undefined {
  switch (reason) {
    case 'ContainerUnsupported': {
      return t('playbackReasonContainerUnsupported', { container: values.container });
    }
    case 'CodecUnsupported': {
      return t('playbackReasonCodecUnsupported', { codec: values.codec });
    }
    case 'CodecsUnsupported': {
      return t('playbackReasonCodecsUnsupported', { video: values.video, audio: values.audio });
    }
    case 'HdrOnSdrDisplay': {
      return t('playbackReasonHdrOnSdrDisplay');
    }
    case 'SubtitleBurnIn': {
      return t('playbackReasonSubtitleBurnIn');
    }
    case 'ExceedsQuality': {
      return t('playbackReasonExceedsQuality');
    }
    case 'SecondaryAudioTrack': {
      return t('playbackReasonSecondaryAudioTrack');
    }
    case 'ExternalAudioTrack': {
      return t('playbackReasonExternalAudioTrack');
    }
    case 'FailedBefore': {
      return t('playbackReasonFailedBefore');
    }
    case 'NothingWorked': {
      return t('playbackReasonNothingWorked');
    }
    case 'NotSmooth': {
      return t('playbackReasonNotSmooth');
    }
    case 'NotAllowedByQuality': {
      return t('playbackReasonNotAllowedByQuality');
    }
    case 'PolicySimplerMethod': {
      return t('playbackReasonPolicySimplerMethod');
    }
    case 'PolicyNeededMethod': {
      return t('playbackReasonPolicyNeededMethod');
    }
    case 'NoDecodableTarget': {
      return t('playbackReasonNoDecodableTarget');
    }
    case 'NoHlsPlayback': {
      return t('playbackReasonNoHlsPlayback');
    }
    case 'QualityNotAllowedByPolicy': {
      return t('playbackReasonQualityNotAllowedByPolicy');
    }
    case 'HdrNotAllowedByPolicy': {
      return t('playbackReasonHdrNotAllowedByPolicy');
    }
    case undefined: {
      return undefined;
    }
  }
}

/**
 * A label in words: the method (told as an attempt when it is one), with its reason when one explains it. The version
 * selector describes each version this way.
 */
export function getLabelDescription(t: Translate, label: VerdictLabel): string {
  const method = getLabelMethodName(t, label);
  const reason = getLabelReasonName(t, label);

  return reason ? t('playbackMethodWithReason', { method, reason }) : method;
}

/**
 * The name of the method a verdict predicts for a source, told as an attempt when it is one
 *
 * @param verdict - How the source was expected to play
 * @param source - The media source it is about, when known (it tells apart a video transcode that also encodes the
 * audio)
 */
export function getPredictedMethodName(t: Translate, verdict: Verdict, source: MediaSourceInfo | undefined): string {
  const label: VerdictLabel = source
    ? getVerdictLabel(verdict, source)
    : { method: verdict.method, ...(verdict.unverified && { attempt: true as const }) };

  return getLabelMethodName(t, label);
}

/**
 * The name of the method a playback uses: the server's, told apart when a video transcode also encodes the audio
 * (see `getVerdictLabel`). A playback whose answer is not played is told as not playable, with the failure's reason.
 *
 * @param verdict - The verdict the playback was negotiated with
 * @param source - The media source it plays, when known
 * @param actualMethod - The method the server chose
 * @param failure - Why the server's answer is not played, when it is not
 */
export function getPlayingMethodName(
  t: Translate,
  verdict: Verdict,
  source: MediaSourceInfo | undefined,
  actualMethod: PlaybackMethod,
  failure?: PlaybackFailure
): string {
  if (!source) {
    return getPlaybackMethodName(t, failure ? 'Unplayable' : actualMethod);
  }

  const label = getVerdictLabel(verdict, source, actualMethod, failure);

  return failure ? getLabelDescription(t, label) : getPlaybackMethodName(t, label.method);
}

/**
 * The name of a quality (Automatic, Original or a resolution): the one place that names it, for the quality menu, the
 * settings page and the playback statistics
 */
export function getQualityName(t: Translate, quality: QualityMenuEntry): string {
  if (quality === 'auto') {
    return t('auto');
  }

  return quality === 'original' ? t('original') : t('qualityLevel', { height: quality });
}

/**
 * Why the method or the quality changed
 */
export function getPlaybackChangeReasonName(t: Translate, reason: PlaybackChangeReason): string {
  switch (reason) {
    case 'mediaError': {
      return t('playbackChangeMediaError');
    }
    case 'hlsMediaError': {
      return t('playbackChangeHlsMediaError');
    }
    case 'hlsCodecError': {
      return t('playbackChangeHlsCodecError');
    }
    case 'noPicture': {
      return t('playbackChangeNoPicture');
    }
    case 'noFrames': {
      return t('playbackChangeNoFrames');
    }
    case 'manual': {
      return t('playbackChangeManual');
    }
    case 'lateProbe': {
      return t('playbackChangeLateProbe');
    }
    case 'notSmooth': {
      return t('playbackChangeNotSmooth');
    }
    case 'networkDown': {
      return t('playbackChangeNetworkDown');
    }
    case 'networkUp': {
      return t('playbackChangeNetworkUp');
    }
  }
}

/**
 * The notice of a change of method, which follows its cause: a failure is told as a problem, other causes (the user
 * asked for another method, reading the file showed it needs another one) in the words the playback statistics use
 *
 * @param reason - Why the method changed
 * @param method - The method played now
 */
export function getMethodChangeNotice(t: Translate, reason: PlaybackChangeReason, method: MethodLabel): string {
  const methodName = getPlaybackMethodName(t, method);

  switch (reason) {
    case 'manual':
    case 'lateProbe': {
      return t('playbackMethodChangedBecause', { reason: getPlaybackChangeReasonName(t, reason), method: methodName });
    }
    default: {
      return t('playbackMethodChanged', { method: methodName });
    }
  }
}

/**
 * Why no other playback method can be tried, in words: the quality mode (Original only allows the original file) or the
 * user's policy forbids the ones left, or none is left. The player's menu and the notice shown when a playback can't go
 * on take it from here, so they say the same in the same state.
 *
 * @param blockedBy - What forbids the methods left; undefined when none is left
 * @param ended - For the notice of a playback that ended: with nothing forbidden, every method was tried and failed
 */
export function getNoOtherMethodText(t: Translate, blockedBy: 'quality' | 'policy' | undefined, ended = false): string {
  switch (blockedBy) {
    case 'quality': {
      return t('noOtherMethodInOriginalQuality');
    }
    case 'policy': {
      return t('noOtherMethodAllowed');
    }
    case undefined: {
      return t(ended ? 'everyPlaybackMethodFailed' : 'noOtherPlaybackMethod');
    }
  }
}
