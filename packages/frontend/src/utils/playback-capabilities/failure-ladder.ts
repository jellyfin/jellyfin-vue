/**
 * The failure ladder: what a hard failure of a playback teaches, and which method comes next.
 *
 * A hard failure (the media element or hls.js reports an error it cannot recover from, the video has no picture, or
 * the frames stop while the time goes on, or the user says it does not play) moves one rung down the ladder: direct
 * play, remux, audio transcode, video transcode. The failure is learned for the session, so the next verdict starts
 * above the failed rung (see `getNextFloor`). The verdict then picks the cheapest rung the browser plays and the quality
 * mode and policy allow; this module only says what to learn and which rung that should be.
 *
 * A learned floor has one of two scopes (owner's rules, 2026-11-13): one media source (item and version), or every
 * media source with the same streams (the verdict's signature: container and codec strings). A verdict starts at the
 * higher of the two (see {@link getScopedFloor}). The source's floor is the memory of that file's own ladder: every hard
 * failure raises it. The signature is taught only what looks like a wrong answer of the browser, so a broken file, a
 * transient error or the server's own limits never spread to every file with the same codecs (see
 * {@link getFailureLesson}):
 * - a failure before the playback had worked (no frame presented with the time advancing; for music, the time not
 * advancing) is what a codec the browser claims and cannot play looks like: the signature learns it. One after the
 * playback had worked is about that file or that moment: only the source learns it
 * - the user's "try another method" teaches the signature: it exists for what no signal detects (silent audio)
 * - the signature is only taught a floor that leaves a rung this client may play: nothing left (`Unplayable`, or every
 * rung above forbidden by the quality mode or the policy) is learned for the source only
 * - a source whose full transcode failed too (it no longer depends on the source's codecs) shows that what it taught
 * the signature during that playback was not about the codecs: it is withdrawn
 * - what the server answers (its bitrate limits, its own reasons to encode) teaches the source, never the signature;
 * an answer without a media source teaches nothing
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

/**
 * == WHAT A FAILURE TEACHES EACH SCOPE ==
 */

/**
 * What a hard failure is evidence of (see the module documentation):
 * - `browser`: the playback had not worked yet, or the user says it does not play: what a wrong answer of the browser
 * looks like
 * - `file`: the playback had worked: the failure is about that file or that moment
 */
export type FailureEvidence = 'browser' | 'file';

/**
 * What one hard failure teaches: the floor of the media source that failed, the floor of its signature (if any), and
 * whether what the same playback taught the signature is withdrawn (the source exhausted the ladder)
 */
export interface FailureLesson {
  readonly source: PlaybackMethod;
  readonly signature?: PlaybackRung;
  readonly withdraw: boolean;
}

/**
 * What a failure of the `floor` kind (see {@link FailureStep}) teaches each scope. See the module documentation for the
 * rules.
 *
 * @param step - Where the ladder failed and what is left (see {@link getFailureStep})
 * @param evidence - Whether the playback had worked before it failed
 */
export function getFailureLesson(step: Extract<FailureStep, { learn: 'floor' }>, evidence: FailureEvidence): FailureLesson {
  // The full transcode failed: it no longer depends on the source's codecs, so nothing is left for this source
  const exhausted = step.next === undefined && step.blockedBy === undefined;
  const above = PLAYBACK_RUNGS[PLAYBACK_RUNGS.indexOf(step.failedAt) + 1];

  return {
    source: exhausted || above === undefined ? 'Unplayable' : above,
    // Only while a rung is left for this playback: one file never leaves a signature nothing this client may play
    ...(evidence === 'browser' && step.next !== undefined && above !== undefined && { signature: above }),
    withdraw: exhausted
  };
}

/**
 * Identifies what a lesson is about: the media source (item id and media source id), its streams (the verdict's
 * signature) and the playback that taught it (its chain of renegotiations: one play of that source)
 */
export interface LessonScope {
  readonly source: string;
  readonly signature: string;
  readonly chain: string;
}

/**
 * A floor a media source taught its signature during one playback
 */
interface SignatureLesson extends LessonScope {
  readonly floor: PlaybackRung;
}

/**
 * What the session learned: the floor of each media source, and the lessons the signatures were taught (a signature's
 * floor is the highest of its lessons, so withdrawing one playback's lessons leaves the others'). Plain values: replace
 * it with the result of {@link learnFailure} or {@link learnSourceFloor}.
 */
export interface LearnedFloors {
  readonly sources: ReadonlyMap<string, PlaybackMethod>;
  readonly lessons: readonly SignatureLesson[];
}

/**
 * Nothing learned
 */
export const NO_LEARNED_FLOORS: LearnedFloors = Object.freeze({ sources: new Map<string, PlaybackMethod>(), lessons: [] });

/**
 * The higher of two optional methods
 */
function higher(a: PlaybackMethod | undefined, b: PlaybackMethod | undefined): PlaybackMethod | undefined {
  return a === undefined || (b !== undefined && isMoreExpensive(b, a)) ? b : a;
}

/**
 * The floor a verdict starts at: the higher of its media source's floor and its signature's (the highest lesson any
 * source taught it)
 *
 * @param floors - What was learned
 * @param signature - The verdict's signature
 * @param source - The media source's key (see {@link LessonScope}); without it, only the signature's floor
 */
export function getScopedFloor(floors: LearnedFloors, signature: string, source?: string): PlaybackMethod | undefined {
  let floor = source === undefined ? undefined : floors.sources.get(source);

  for (const lesson of floors.lessons) {
    if (lesson.signature === signature) {
      floor = higher(floor, lesson.floor);
    }
  }

  return floor;
}

/**
 * Records a floor for one media source (floors only rise)
 */
export function learnSourceFloor(floors: LearnedFloors, source: string, floor: PlaybackMethod): LearnedFloors {
  const current = floors.sources.get(source);

  return current !== undefined && !isMoreExpensive(floor, current)
    ? floors
    : { ...floors, sources: new Map([...floors.sources, [source, floor]]) };
}

/**
 * Records what a hard failure taught (see {@link getFailureLesson})
 *
 * @param floors - What was learned so far
 * @param scope - The playback that failed
 * @param lesson - What the failure teaches
 */
export function learnFailure(floors: LearnedFloors, scope: LessonScope, lesson: FailureLesson): LearnedFloors {
  const { lessons, sources } = learnSourceFloor(floors, scope.source, lesson.source);
  const kept = lesson.withdraw ? lessons.filter(taught => taught.chain !== scope.chain || taught.source !== scope.source) : lessons;

  return {
    sources,
    lessons: lesson.signature === undefined ? kept : [...kept, { ...scope, floor: lesson.signature }]
  };
}
