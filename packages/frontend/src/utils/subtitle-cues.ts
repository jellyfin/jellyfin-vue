/**
 * Which cue of a parsed subtitle track the app's own subtitle overlay shows at a time
 */
import type { Dialogue } from '#/plugins/workers/generic/subtitles.ts';

/**
 * The cue to show at a media time: the one shown before when it still covers the time, else the one after it (playback
 * mostly moves forward one cue at a time), else whichever cue covers the time, searched in the whole track (a seek, in
 * either direction, or another track)
 *
 * @param cues - The cues of the track, in the order of the file
 * @param time - The media time, in seconds
 * @param previous - The index the previous lookup returned, if any
 * @returns The index of the cue that covers the time, or undefined when none does
 */
export function findCueIndex(cues: readonly Dialogue[], time: number, previous?: number): number | undefined {
  const covers = (cue: Dialogue | undefined): boolean => cue !== undefined && cue.start <= time && time <= cue.end;

  if (previous !== undefined) {
    if (covers(cues[previous])) {
      return previous;
    }

    if (covers(cues[previous + 1])) {
      return previous + 1;
    }
  }

  const index = cues.findIndex(cue => covers(cue));

  return index === -1 ? undefined : index;
}
