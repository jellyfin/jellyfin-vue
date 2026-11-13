/**
 * Renegotiations of a playback in progress: which ones replace the playback whatever they give.
 *
 * Who asks for a renegotiation knows why, and says so:
 * - `replace`: what the playback is made of changed (another item, version or track, a setting the user changed) or it
 * failed (a hard failure, a rung of the ladder). The new negotiation replaces the current one whatever it gives: an
 * unplayable result is the honest one.
 * - `improve`: the app tries, by itself, to play better a playback that works: a quality step of Automatic, or a probe
 * stored late showing that the method in use is not enough. If the new negotiation is unplayable or fails, the
 * current playback goes on as it is.
 */
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
