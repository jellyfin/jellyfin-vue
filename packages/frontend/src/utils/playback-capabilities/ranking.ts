/**
 * Orders the versions (media sources) of an item from most to least compatible with this client.
 *
 * Penalties, from worst to mildest: unplayable, video transcode (much worse than everything below), not smooth,
 * audio transcode, remux, none. Each penalty outweighs all the milder ones together. Ties go to the higher
 * quality (resolution, then bitrate) and then to the server's order.
 */
import type { Verdict } from './verdict.ts';

/**
 * The penalties of a verdict, worst first, as 0/1 so they compare lexicographically
 */
function getPenalties(verdict: Verdict): number[] {
  return [
    verdict.method === 'Unplayable',
    verdict.method === 'TranscodeVideo',
    !verdict.smooth,
    verdict.method === 'TranscodeAudio',
    verdict.method === 'Remux'
  ].map(Number);
}

/**
 * Compares two verdicts: negative if `a` is more compatible than `b`, positive if less, 0 if they tie
 * (the caller keeps the server's order then)
 */
export function compareVerdicts(a: Verdict, b: Verdict): number {
  const penaltiesA = getPenalties(a);
  const penaltiesB = getPenalties(b);

  for (const [index, penalty] of penaltiesA.entries()) {
    const difference = penalty - penaltiesB[index]!;

    if (difference !== 0) {
      return difference;
    }
  }

  const pixels = (verdict: Verdict) => (verdict.quality.width ?? 0) * (verdict.quality.height ?? 0);

  return (pixels(b) - pixels(a)) || ((b.quality.bitrate ?? 0) - (a.quality.bitrate ?? 0));
}

/**
 * The indexes of the verdicts, most compatible first. The sort is stable, so ties keep the server's order.
 */
export function rankVerdicts(verdicts: readonly Verdict[]): number[] {
  return verdicts
    .map((_, index) => index)
    .toSorted((a, b) => compareVerdicts(verdicts[a]!, verdicts[b]!));
}

/**
 * The index of the most compatible verdict, or -1 if there are none or none plays: an unplayable version is never the
 * most compatible one (the playback of an item without one starts with the server's first version)
 */
export function pickBest(verdicts: readonly Verdict[]): number {
  const best = rankVerdicts(verdicts)[0];

  return best === undefined || verdicts[best]?.method === 'Unplayable' ? -1 : best;
}
