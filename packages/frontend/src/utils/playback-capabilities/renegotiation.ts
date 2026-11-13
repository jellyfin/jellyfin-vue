/**
 * Renegotiations of a playback in progress: which ones replace the playback whatever they give, and when a probe
 * stored late corrects the playing method.
 *
 * Who asks for a renegotiation knows why, and says so:
 * - `replace`: what the playback is made of changed (another item, version or track, a setting the user changed) or it
 * failed (a hard failure, a rung of the ladder). The new negotiation replaces the current one whatever it gives: an
 * unplayable result is the honest one.
 * - `improve`: the app tries, by itself, to play better a playback that works: a quality step of Automatic, or a probe
 * stored late showing that the method in use is not enough. If the new negotiation is unplayable or fails, the
 * current playback goes on as it is.
 */
import { isMoreExpensive, type PlaybackMethod } from './verdict.ts';

export type RenegotiationIntent = 'replace' | 'improve';

/**
 * What a negotiation gave: something to play, nothing playable (an unplayable verdict, or an answer that must not be
 * played), or no answer (the request failed)
 */
export type RenegotiationOutcome = 'playable' | 'unplayable' | 'failed';

/**
 * Whether the current playback goes on instead of taking the result of a negotiation
 *
 * @param intent - Why the negotiation was asked for
 * @param result - Whether a playback of the same item and version is in progress and works (`playing`), and what the
 * negotiation gave
 */
export function keepsCurrentPlayback(
  intent: RenegotiationIntent,
  { playing, outcome }: { readonly playing: boolean; readonly outcome: RenegotiationOutcome }
): boolean {
  return intent === 'improve' && playing && outcome !== 'playable';
}

/**
 * What decides whether a probe stored after a playback started corrects it
 */
export interface LateProbeCheck {
  /**
   * The verdict the playback was negotiated with (whether it relied on streams nobody could check) and the method the
   * server uses
   */
  readonly playing: { readonly unverified: boolean; readonly method: PlaybackMethod };
  /**
   * The verdict computed again with the probe, for the same version, tracks and quality mode
   */
  readonly corrected: { readonly unverified: boolean; readonly method: PlaybackMethod };
  /**
   * Whether another change of the playback is under way (a newer negotiation, a failure being handled)
   */
  readonly changePending: boolean;
  readonly paused: boolean;
}

/**
 * Whether a probe stored late corrects the playback in progress (owner's decision, 2026-11-13): the playing verdict
 * relied on streams nobody could check, the recomputed one doesn't, and it asks for a method more expensive than the
 * one the server uses. Never towards the same or a cheaper method, never to an unplayable verdict (there's nothing
 * better to switch to: the current playback goes on), never while another change is under way, and not while paused
 * (it's checked again when the playback resumes).
 */
export function shouldCorrectWithLateProbe({ playing, corrected, changePending, paused }: LateProbeCheck): boolean {
  return playing.unverified
    && !corrected.unverified
    && corrected.method !== 'Unplayable'
    && isMoreExpensive(corrected.method, playing.method)
    && !changePending
    && !paused;
}
