/**
 * The versions (media sources) of an item ranked by how this client plays them: the verdict of each version and the
 * most compatible one, which is played when no version was chosen and preselected wherever a version can be picked.
 *
 * The ranking evaluates the default tracks of every version, so the tracks picked for one version never move the
 * choice to another one; the verdict shown for a version follows the tracks picked for it.
 */
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { readonly, shallowRef, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue';
import { PROBE_TIMEOUT_MS, VERSION_RESOLUTION_WAIT_MS } from '#/utils/playback-capabilities/constants.ts';
import { pickBest } from '#/utils/playback-capabilities/ranking.ts';
import type { Verdict } from '#/utils/playback-capabilities/verdict.ts';
import {
  getMediaSourceVerdict,
  verdictEnvironmentSources,
  type MediaSourceVerdictOptions,
  type StreamSelection
} from '#/store/playback-capabilities.ts';

/**
 * The verdicts of every version of an item with its default tracks, and the index of the most compatible one
 */
export interface MediaSourceRanking {
  readonly verdicts: readonly Verdict[];
  /**
   * Index in `MediaSources` of the most compatible version, -1 when the item has none
   */
  readonly best: number;
}

/**
 * Ranks the versions of an item: one verdict per version with its default tracks (concurrently: they share the
 * oracle's answers, and each version is probed once)
 *
 * @param item - The item, with its `MediaSources`
 * @param options - See {@link MediaSourceVerdictOptions}
 */
export async function rankMediaSources(item: BaseItemDto, options?: MediaSourceVerdictOptions): Promise<MediaSourceRanking> {
  const verdicts = await Promise.all(
    (item.MediaSources ?? []).map(async source => getMediaSourceVerdict(item, source, {}, options))
  );

  return { verdicts, best: pickBest(verdicts) };
}

/**
 * The version to play of an item no version was chosen for: the most compatible one. Waits at most
 * {@link VERSION_RESOLUTION_WAIT_MS} for the ranking; without it in time, or if it fails, the server's first version.
 *
 * @param item - The item, with its `MediaSources`
 * @returns The index in `MediaSources`
 */
export async function resolveMediaSourceIndex(item: BaseItemDto): Promise<number> {
  if ((item.MediaSources?.length ?? 0) < 2) {
    return 0;
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<undefined>((resolve) => {
    timer = setTimeout(() => {
      resolve(undefined);
    }, VERSION_RESOLUTION_WAIT_MS);
  });

  try {
    const ranking = await Promise.race([rankMediaSources(item), expired]);

    return Math.max(ranking?.best ?? 0, 0);
  } catch {
    return 0;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Computes, in the background, the verdicts of every version of an item that is about to be played: its files are
 * probed and stored, and the browser's answers memoised, so its version and its negotiation are ready when it starts
 *
 * @param item - The item, with its `MediaSources`
 */
export async function prefetchMediaSourceVerdicts(item: BaseItemDto): Promise<void> {
  try {
    await rankMediaSources(item, { probeWaitMs: PROBE_TIMEOUT_MS });
  } catch {
    // Nothing is lost: the verdicts are computed again when the item is played
  }
}

/**
 * Tracks picked for one version of an item
 */
export interface VersionTracks {
  /**
   * Index in `MediaSources` of the version the tracks belong to
   */
  readonly index: number;
  readonly tracks: StreamSelection;
}

/**
 * Verdicts of the versions of an item, kept up to date with everything they depend on
 */
export interface MediaSourceVerdicts {
  /**
   * The verdict of each version (same order as `MediaSources`), with the tracks picked for it or its default ones.
   * Empty until the first ones are computed for the item.
   */
  readonly verdicts: Readonly<Ref<readonly Verdict[]>>;
  /**
   * Index in `MediaSources` of the most compatible version (see {@link rankMediaSources}); undefined until known
   */
  readonly best: Readonly<Ref<number | undefined>>;
}

/**
 * The verdicts of the versions of an item, recomputed whenever the item, its versions, the picked tracks or the
 * client's environment (settings, policy, HDR display, what was learned) change. Results of an older computation that
 * arrive late are dropped.
 *
 * @param item - The item, with its `MediaSources`
 * @param picked - The tracks picked for one of its versions, if any
 */
export function useMediaSourceVerdicts(
  item: MaybeRefOrGetter<BaseItemDto | undefined>,
  picked?: MaybeRefOrGetter<VersionTracks | undefined>
): MediaSourceVerdicts {
  const verdicts = shallowRef<readonly Verdict[]>([]);
  const best = shallowRef<number>();
  let computation = 0;

  /**
   * Primitive keys: the item objects are replaced on every refresh of their data
   */
  const itemKey = () => {
    const value = toValue(item);

    return value?.Id
      ? [value.Id, ...(value.MediaSources ?? []).map(source => `${source.Id ?? ''}:${source.ETag ?? ''}`)].join('|')
      : undefined;
  };
  const pickedKey = () => {
    const value = toValue(picked);

    return value
      ? [value.index, value.tracks.videoStreamIndex, value.tracks.audioStreamIndex, value.tracks.subtitleStreamIndex].join('|')
      : undefined;
  };

  watch([itemKey, pickedKey, ...verdictEnvironmentSources], async ([key], previous) => {
    const id = ++computation;
    const value = toValue(item);
    const tracks = toValue(picked);
    const pickedSource = tracks ? value?.MediaSources?.[tracks.index] : undefined;

    // What was shown for another item must not stay while this one is computed
    if (key !== previous[0]) {
      verdicts.value = [];
      best.value = undefined;
    }

    if (!value?.Id) {
      return;
    }

    try {
      const [ranking, pickedVerdict] = await Promise.all([
        rankMediaSources(value),
        tracks && pickedSource ? getMediaSourceVerdict(value, pickedSource, tracks.tracks) : undefined
      ]);

      if (id === computation) {
        verdicts.value = ranking.verdicts.map((verdict, index) =>
          index === tracks?.index && pickedVerdict ? pickedVerdict : verdict);
        best.value = ranking.best === -1 ? undefined : ranking.best;
      }
    } catch {
      // Without verdicts nothing is shown: playback computes its own
    }
  }, { immediate: true });

  return { verdicts: readonly(verdicts), best: readonly(best) };
}
