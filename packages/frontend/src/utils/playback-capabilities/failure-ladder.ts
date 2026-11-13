/**
 * The failure ladder: what a hard failure of a playback teaches, and which method comes next.
 *
 * A hard failure (the media element or hls.js reports an error it cannot recover from, the video has no picture, or
 * the frames stop while the time goes on, or the user says it does not play) moves one rung down the ladder: direct
 * play, remux, audio transcode, video transcode. The failure is learned for the session, so the next verdict for the
 * same streams starts above the failed rung (see `getNextFloor`). The verdict then picks the cheapest rung the browser
 * plays and the quality mode and policy allow; this module only says what to learn and which rung that should be.
 */
import type { QualityMode } from './quality.ts';
import {
  getRungRejection,
  isMoreExpensive,
  PLAYBACK_RUNGS,
  type PlaybackMethod,
  type PlaybackPolicy,
  type PlaybackRung,
  type StreamPlan
} from './verdict.ts';

/**
 * The playback that failed: the method the server was using, the plan of its streams (from the verdict it was
 * negotiated with) and what limits the next method
 */
export interface FailureStepInput {
  readonly method: PlaybackMethod;
  /**
   * The method the verdict asked for. What failed is never below it: the server cannot do less than the request
   * forces, but its answer may not tell what it did (an answer that names no stream reads as a remux), and a failure
   * learned below the request would negotiate the same request again.
   */
  readonly asked?: PlaybackMethod;
  readonly video?: StreamPlan;
  readonly audio?: StreamPlan;
  /**
   * The type of item the server sees, which decides the permission its rungs above direct play need: the server
   * treats a video item as a video whatever its streams (an audio-only file in a video library needs the permission to
   * transcode video). Undefined: whether the plan has a video stream.
   */
  readonly mediaType?: 'Video' | 'Audio';
  readonly mode: QualityMode;
  readonly policy: PlaybackPolicy;
}

/**
 * What a hard failure teaches:
 * - `floor`: the failed rung is learned, so the next verdict starts above it
 * - `copied-audio`: a video transcode failed while the audio was copied. Encoding the video was the last rung of the
 * linear ladder, but the copied audio is still a suspect: its media source answers are disproved, so the next verdict
 * encodes it too
 * - `nothing`: nothing was being played
 *
 * `next` is the rung that should come next; without it nothing is left, and `blockedBy` says whether the quality mode
 * or the user policy is what forbids the rungs above (otherwise the ladder is over).
 */
export type FailureStep
  = | { readonly learn: 'floor'; readonly failedAt: PlaybackRung; readonly next?: PlaybackRung; readonly blockedBy?: 'quality' | 'policy' }
    | { readonly learn: 'copied-audio'; readonly failedAt: 'TranscodeVideo'; readonly next?: 'TranscodeVideo'; readonly blockedBy?: 'quality' | 'policy' }
    | { readonly learn: 'nothing' };

/**
 * The first rung of the candidates the quality mode and the policy allow, or what forbids them all (the quality
 * mode is reported before the policy, like the verdict does)
 */
function firstAllowed<T extends PlaybackRung>(
  input: FailureStepInput,
  candidates: readonly { rung: T; encodesAudio: boolean }[]
): { next?: T; blockedBy?: 'quality' | 'policy' } {
  const rejections = new Set<'quality' | 'policy'>();
  const video = (input.mediaType ?? (input.video === undefined ? 'Audio' : 'Video')) === 'Video';

  for (const { rung, encodesAudio } of candidates) {
    const rejection = getRungRejection({ quality: input.mode, policy: input.policy }, rung, { video, encodesAudio });

    if (!rejection) {
      return { next: rung };
    }

    rejections.add(rejection);
  }

  if (rejections.has('quality')) {
    return { blockedBy: 'quality' };
  }

  return rejections.has('policy') ? { blockedBy: 'policy' } : {};
}

/**
 * What a hard failure of a playback teaches and which rung should come next. See {@link FailureStep}.
 */
export function getFailureStep(input: FailureStepInput): FailureStep {
  const { video, audio, asked } = input;
  const method = asked !== undefined && isMoreExpensive(asked, input.method) ? asked : input.method;

  if (method === 'Unplayable') {
    return { learn: 'nothing' };
  }

  if (method === 'TranscodeVideo' && audio?.action === 'copy') {
    return { learn: 'copied-audio', failedAt: method, ...firstAllowed(input, [{ rung: 'TranscodeVideo' as const, encodesAudio: true }]) };
  }

  const audioEncoded = audio?.action === 'transcode';
  const candidates = PLAYBACK_RUNGS
    .slice(PLAYBACK_RUNGS.indexOf(method) + 1)
    // Music has no video to encode
    .filter(rung => rung !== 'TranscodeVideo' || video !== undefined)
    .map(rung => ({ rung, encodesAudio: rung === 'TranscodeAudio' || (rung === 'TranscodeVideo' && audioEncoded) }));

  return { learn: 'floor', failedAt: method, ...firstAllowed(input, candidates) };
}
