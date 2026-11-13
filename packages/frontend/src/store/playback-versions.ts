/**
 * The versions (media sources) of an item ranked by how this client plays them: the verdict of each version and the
 * most compatible one, which is played when no version was chosen and preselected wherever a version can be picked.
 *
 * The ranking evaluates the default tracks of every version, so the tracks picked for one version never move the
 * choice to another one; the verdict shown for a version follows the tracks picked for it.
 */
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { computed, readonly, shallowRef, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue';
import { isNil } from '@jellyfin-vue/shared/validation';
import { withTimeout } from '@jellyfin-vue/shared/promises';
import { PROBE_TIMEOUT_MS, VERSION_RESOLUTION_WAIT_MS } from '#/utils/playback-capabilities/constants.ts';
import { pickBest } from '#/utils/playback-capabilities/ranking.ts';
import type { Verdict } from '#/utils/playback-capabilities/verdict.ts';
import {
  getMediaSourceVerdict,
  verdictEnvironmentSources,
  type MediaSourceVerdictOptions,
  type StreamSelection
} from '#/store/playback-capabilities.ts';
import { playbackSettings } from '#/store/settings/playback.ts';

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
 * What is known of the ranking of the versions of an item
 */
export interface RankingState {
  /**
   * Index in `MediaSources` of the most compatible version, once ranked
   */
  readonly best?: number;
  /**
   * Whether the wait for the ranking is over: it arrived, it failed, or it didn't arrive within
   * {@link VERSION_RESOLUTION_WAIT_MS}
   */
  readonly settled: boolean;
}

/**
 * The version played of an item no version was chosen for, as an index in its `MediaSources`: the most compatible
 * one or, when automatic version selection is off, there's nothing to choose from, or the ranking failed or didn't
 * arrive in time, the server's first one. Undefined while the ranking must still be waited for.
 *
 * This rule lives only here: the playback manager (through {@link resolveMediaSourceIndex}) and the views that
 * preselect a version (through {@link useMediaSourceVerdicts}) use it.
 *
 * @param item - The item, with its `MediaSources`
 * @param ranking - What is known of the ranking of its versions
 */
export function getAutomaticMediaSourceIndex(item: BaseItemDto, ranking: { best?: number; settled: true }): number;
export function getAutomaticMediaSourceIndex(item: BaseItemDto, ranking: RankingState): number | undefined;
export function getAutomaticMediaSourceIndex(item: BaseItemDto, { best, settled }: RankingState): number | undefined {
  if (!playbackSettings.autoSelectVersion.value || (item.MediaSources?.length ?? 0) < 2) {
    return 0;
  }

  if (!isNil(best) && best >= 0) {
    return best;
  }

  return settled ? 0 : undefined;
}

/**
 * Waits for a ranking at most {@link VERSION_RESOLUTION_WAIT_MS}
 *
 * @returns The ranking, or undefined when it fails or doesn't arrive in time
 */
async function waitForRanking(ranking: Promise<MediaSourceRanking>): Promise<MediaSourceRanking | undefined> {
  try {
    return await withTimeout(ranking, VERSION_RESOLUTION_WAIT_MS, undefined);
  } catch {
    return undefined;
  }
}

/**
 * The version to play of an item no version was chosen for (see {@link getAutomaticMediaSourceIndex}), waiting at
 * most {@link VERSION_RESOLUTION_WAIT_MS} for the ranking when it's needed
 *
 * @param item - The item, with its `MediaSources`
 * @returns The index in `MediaSources`
 */
export async function resolveMediaSourceIndex(item: BaseItemDto): Promise<number> {
  const index = getAutomaticMediaSourceIndex(item, { settled: false });

  if (!isNil(index)) {
    return index;
  }

  const ranking = await waitForRanking(rankMediaSources(item));

  return getAutomaticMediaSourceIndex(item, { best: ranking?.best, settled: true });
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
  /**
   * Index in `MediaSources` of the version played when none is chosen (see {@link getAutomaticMediaSourceIndex}),
   * with the same bounded wait for the ranking as the playback manager. Undefined while it's being resolved.
   */
  readonly automatic: Readonly<Ref<number | undefined>>;
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
  /**
   * Whether the wait for the first ranking of the item is over (see {@link RankingState})
   */
  const settled = shallowRef(false);
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

  /**
   * Waits for the first ranking of the item a bounded time, like the playback manager does, and marks the wait as over
   */
  const settle = async (key: string | undefined, pendingRanking: Promise<MediaSourceRanking>) => {
    const ranking = await waitForRanking(pendingRanking);

    if (key !== itemKey()) {
      return;
    }

    if (ranking && ranking.best !== -1 && isNil(best.value)) {
      best.value = ranking.best;
    }

    settled.value = true;
  };

  watch([itemKey, pickedKey, ...verdictEnvironmentSources], async ([key], previous) => {
    const id = ++computation;
    const value = toValue(item);
    const tracks = toValue(picked);
    const pickedSource = tracks ? value?.MediaSources?.[tracks.index] : undefined;

    const isNewItem = key !== previous[0];

    // What was shown for another item must not stay while this one is computed
    if (isNewItem) {
      verdicts.value = [];
      best.value = undefined;
      settled.value = false;
    }

    if (!value?.Id) {
      return;
    }

    const pendingRanking = rankMediaSources(value);

    if (isNewItem) {
      void settle(key, pendingRanking);
    }

    try {
      const [ranking, pickedVerdict] = await Promise.all([
        pendingRanking,
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

  const automatic = computed(() => {
    const value = toValue(item);

    return value ? getAutomaticMediaSourceIndex(value, { best: best.value, settled: settled.value }) : undefined;
  });

  return { verdicts: readonly(verdicts), best: readonly(best), automatic };
}
