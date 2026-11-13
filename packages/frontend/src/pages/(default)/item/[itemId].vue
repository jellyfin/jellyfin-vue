<template>
  <ItemCols>
    <template #left>
      <VRow
        justify="center"
        justify-md="start">
        <VCol
          cols="6"
          md="3">
          <ItemCard :item="item" />
        </VCol>
        <VCol
          cols="12"
          md="9">
          <h1
            class="text-h5 text-sm-h4"
            :class="{ 'uno-text-center': !$vuetify.display.mdAndUp }">
            {{ item.Name }}
          </h1>
          <h2
            v-if="item.OriginalTitle && item.OriginalTitle !== item.Name"
            class="text-subtitle-1"
            :class="{ 'uno-text-center': !$vuetify.display.mdAndUp }">
            {{ item.OriginalTitle }}
          </h2>
          <h3
            v-if="currentSeries"
            class="text-h6 font-weight-heavy"
            :class="{'uno-text-center': !$vuetify.display.mdAndUp }">
            <RouterLink
              class="link uno-font-medium uno-mt-1 uno-p-0 uno-block uno-truncate"
              :to="getItemDetailsLink(currentSeries)">
              {{ currentSeries.Name }}
            </RouterLink>
          </h3>
          <div
            class="text-h4 text-caption uno-font-medium uno-mt-2"
            :class="{ 'uno-text-center': !$vuetify.display.mdAndUp }">
            <MediaInfo
              :item="item"
              year
              runtime
              rating
              ends-at />
          </div>
          <VRow
            class="uno-my-4 uno-items-center"
            :class="{
              'uno-justify-center': !$vuetify.display.mdAndUp,
              'uno-ml-0': $vuetify.display.mdAndUp
            }">
            <PlayButton
              class="uno-mr-2"
              :item="item"
              :loading="isResolvingVersion"
              :disabled="isResolvingVersion"
              :media-source-index="currentSourceIndex"
              :video-track-index="currentVideoTrack"
              :audio-track-index="displayedAudioTrack"
              :subtitle-track-index="displayedSubtitleTrack" />
            <LikeButton
              :item="item"
              class="uno-mr-2" />
            <MarkPlayedButton
              :item="item"
              class="uno-mr-2" />
            <ItemMenu
              :item="item"
              :media-source-index="currentSourceIndex"
              :playback-media-source-index="isResolvingVersion ? undefined : currentSourceIndex"
              :video-track-index="currentVideoTrack"
              :audio-track-index="displayedAudioTrack"
              :subtitle-track-index="displayedSubtitleTrack" />
          </VRow>
          <VCol
            cols="12"
            md="10">
            <VRow
              v-if="item && item.GenreItems && item.GenreItems.length"
              align="center">
              <VCol
                :cols="12"
                :sm="2"
                class="uno-px-0 uno-truncate">
                <label class="text--secondary">{{ $t('genres') }}</label>
              </VCol>
              <VCol
                class="uno-px-0"
                :cols="12"
                :sm="10">
                <VSlideGroup>
                  <VSlideGroupItem
                    v-for="(genre, index) in item.GenreItems"
                    :key="`genre-${genre.Id}`">
                    <VChip
                      size="small"
                      link
                      :class="{ 'uno-ml-2': index > 0 }"
                      :to="`/genre/${genre.Id}?type=${item.Type}`">
                      {{ genre.Name }}
                    </VChip>
                  </VSlideGroupItem>
                </VSlideGroup>
              </VCol>
            </VRow>
            <VRow
              v-if="item && directors.length && !$vuetify.display.smAndUp"
              align="center">
              <VCol
                :cols="12"
                :sm="2"
                class="mt-sm-3 py-sm-0 uno-px-0 uno-truncate">
                <label class="text--secondary">{{ $t('directing') }}</label>
              </VCol>
              <VCol
                class="uno-px-0"
                :cols="12"
                :sm="10">
                <VSlideGroup>
                  <VSlideGroupItem
                    v-for="director in directors"
                    :key="director.Id">
                    <VChip
                      size="small"
                      link
                      :to="getItemDetailsLink(director, 'Person')">
                      {{ director.Name }}
                    </VChip>
                  </VSlideGroupItem>
                </VSlideGroup>
              </VCol>
            </VRow>
            <VRow
              v-if="item && writers.length && !$vuetify.display.smAndUp"
              align="center">
              <VCol
                :cols="12"
                :sm="2"
                class="mt-sm-3 py-sm-0 uno-px-0 uno-truncate">
                <label class="text--secondary">{{ $t('writing') }}</label>
              </VCol>
              <VCol
                class="uno-px-0"
                :cols="12"
                :sm="10">
                <VSlideGroup>
                  <VSlideGroupItem
                    v-for="writer in writers"
                    :key="writer.Id">
                    <VChip
                      size="small"
                      link
                      :to="getItemDetailsLink(writer, 'Person')">
                      {{ writer.Name }}
                    </VChip>
                  </VSlideGroupItem>
                </VSlideGroup>
              </VCol>
            </VRow>
            <div
              v-if="item && item.MediaSources && item.MediaSources.length"
              class="mt-2">
              <VRow
                v-if="item.MediaSources.length > 1"
                align="center">
                <VCol
                  :cols="12"
                  :sm="2"
                  class="mt-sm-3 py-sm-0 uno-px-0 uno-truncate">
                  <label class="text--secondary">{{ $t('version') }}</label>
                </VCol>
                <VCol
                  class="uno-px-0"
                  :cols="12"
                  :sm="10">
                  <MediaSourceSelector
                    :sources="item.MediaSources"
                    :default-source-index="currentSourceIndex"
                    :verdicts="sourceVerdicts"
                    :best-index="bestSourceIndex"
                    :loading="isResolvingVersion"
                    :disabled="isResolvingVersion"
                    @input="
                      (index) =>
                        (currentSource = item.MediaSources?.[index] ?? {})
                    " />
                </VCol>
              </VRow>
              <VRow align="center">
                <VCol
                  :cols="12"
                  :sm="2"
                  class="mt-sm-3 py-sm-0 uno-px-0 uno-truncate">
                  <label class="text--secondary">{{ $t('video') }}</label>
                </VCol>
                <VCol
                  class="uno-px-0"
                  :cols="12"
                  :sm="10">
                  <MediaStreamSelector
                    v-if="currentSource.MediaStreams"
                    :key="currentSource.Id || ''"
                    :media-streams="
                      getMediaStreams(currentSource.MediaStreams, 'Video')
                    "
                    type="Video"
                    :default-stream-index="currentVideoTrack"
                    :loading="isResolvingVersion"
                    :disabled="isResolvingVersion"
                    @input="(trackIndex) => pickTrack('video', trackIndex)" />
                </VCol>
              </VRow>
              <VRow align="center">
                <VCol
                  :cols="12"
                  :sm="2"
                  class="mt-sm-3 py-sm-0 uno-px-0 uno-truncate">
                  <label class="text--secondary">{{ $t('audio') }}</label>
                </VCol>
                <VCol
                  class="uno-px-0"
                  :cols="12"
                  :sm="10">
                  <MediaStreamSelector
                    v-if="currentSource.MediaStreams"
                    :key="currentSource.Id || ''"
                    :media-streams="
                      getMediaStreams(currentSource.MediaStreams, 'Audio')
                    "
                    type="Audio"
                    :default-stream-index="displayedAudioTrack"
                    :loading="isResolvingVersion"
                    :disabled="isResolvingVersion"
                    @input="(trackIndex) => pickTrack('audio', trackIndex)" />
                </VCol>
              </VRow>
              <VRow align="center">
                <VCol
                  :cols="12"
                  :sm="2"
                  class="mt-sm-3 py-sm-0 uno-px-0 uno-truncate">
                  <label class="text--secondary">{{ $t('subtitles') }}</label>
                </VCol>
                <VCol
                  class="uno-px-0"
                  :cols="12"
                  :sm="10">
                  <MediaStreamSelector
                    v-if="currentSource.MediaStreams"
                    :key="currentSource.Id || ''"
                    :media-streams="
                      getMediaStreams(currentSource.MediaStreams, 'Subtitle')
                    "
                    type="Subtitle"
                    :default-stream-index="displayedSubtitleTrack"
                    :loading="isResolvingVersion"
                    :disabled="isResolvingVersion"
                    @input="(trackIndex) => pickTrack('subtitle', trackIndex)" />
                </VCol>
              </VRow>
            </div>
            <div
              v-else-if="
                item &&
                  item.MediaType === 'Video' &&
                  (!item.MediaSources || item.MediaSources.length === 0)
              "
              class="text-h5 uno-my-4">
              {{ $t('NoMediaSourcesAvailable') }}
            </div>
          </VCol>
          <div>
            <p
              v-if="item.Taglines && item.Taglines.length"
              class="text-subtitle-1 uno-truncate">
              {{ item.Taglines[0] }}
            </p>
            <p
              v-if="item.Overview"
              class="item-overview">
              <JSafeHtml
                :html="item.Overview"
                markdown />
            </p>
          </div>
        </VCol>
      </VRow>
      <VRow>
        <VCol
          v-if="item.Type === 'BoxSet'"
          cols="12">
          <CollectionTabs :items="childItems" />
        </VCol>
        <VCol cols="12">
          <RelatedItems :related-items="relatedItems" />
        </VCol>
      </VRow>
    </template>
    <template #right>
      <div v-if="crew.length">
        <h2 class="text-h6 text-sm-h5">
          {{ $t('crew') }}
        </h2>
        <PeopleList :items="crew" />
      </div>
      <div v-if="actors.length">
        <h2 class="text-h6 text-sm-h5">
          {{ $t('cast') }}
        </h2>
        <PeopleList :items="actors" />
      </div>
    </template>
  </ItemCols>
</template>

<script setup lang="ts">
import type {
  BaseItemPerson,
  MediaSourceInfo
} from '@jellyfin/sdk/lib/generated-client';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { computed, ref, shallowRef, watch } from 'vue';
import { useRoute } from 'vue-router';
import { isNil } from '@jellyfin-vue/shared/validation';
import { useMediaSourceVerdicts } from '#/store/playback-versions.ts';
import { playbackManager } from '#/store/playback-manager.ts';
import { getItemDetailsLink, getMediaStreams, getMergedCrew } from '#/utils/items.ts';
import { getItemizedSelect } from '#/utils/forms.ts';
import { useBaseItem } from '#/composables/apis.ts';
import { useItemBackdrop } from '#/composables/backdrop.ts';
import { useItemPageTitle } from '#/composables/page-title.ts';

const route = useRoute('/(default)/item/[itemId]');

const [
  { data: item },
  { data: relatedItems },
  { data: childItems }
] = await Promise.all([
  useBaseItem(getLibraryApi, 'getItem')(() => ({
    itemId: route.params.itemId
  })),
  useBaseItem(getLibraryApi, 'getSimilarItems')(() => ({
    itemId: route.params.itemId,
    limit: 12
  })),
  useBaseItem(getLibraryApi, 'getItems')(() => ({
    parentId: route.params.itemId
  }))
]);

const { data: currentSeries } = await useBaseItem(getLibraryApi, 'getItem')(() => ({
  itemId: item.value.SeriesId ?? ''
}));

const selectedSource = ref<MediaSourceInfo>();
/**
 * Tracks explicitly chosen by the user, as absolute `MediaStream.Index` values.
 * `undefined` means "not chosen". For subtitles, `-1` means "no subtitles".
 */
const currentVideoTrack = ref<number>();
const currentAudioTrack = ref<number>();
const currentSubtitleTrack = ref<number>();
/**
 * Tracks the selectors display, which are also the ones requested when playing from this page:
 * the user's choice or, if none, the defaults of the media source (computed by the server from
 * the user's settings and remembered selections). They're sent explicitly because the server
 * doesn't always pick the same default when asked for playback info (seen with external
 * subtitles), and what the page shows must be what plays.
 */
const displayedAudioTrack = computed(() =>
  currentAudioTrack.value ?? currentSource.value.DefaultAudioStreamIndex ?? undefined
);
const displayedSubtitleTrack = computed(() =>
  currentSubtitleTrack.value ?? currentSource.value.DefaultSubtitleStreamIndex ?? -1
);

const crew = computed<BaseItemPerson[]>(() =>
  getMergedCrew(item.value.People ?? [])
);

const actors = computed<BaseItemPerson[]>(() =>
  (item.value.People ?? []).filter(person => person.Type === 'Actor').slice(0, 10)
);

const directors = computed<BaseItemPerson[]>(() =>
  crew.value.filter(person => person.Type === 'Director')
);

const writers = computed<BaseItemPerson[]>(() =>
  crew.value.filter(person => person.Type === 'Writer')
);

const selectSources = computed(() =>
  getItemizedSelect(item.value.MediaSources ?? [])
);

const currentSourceIndex = computed(() =>
  selectSources.value.findIndex(el => el.value.Id === currentSource.value.Id)
);

/**
 * Index of the version most compatible with this client, once known (see `useMediaSourceVerdicts` below)
 */
const bestSourceIndex = shallowRef<number>();

/**
 * The version shown while none is picked by hand: the one played when none is chosen (see `useMediaSourceVerdicts`
 * below). Undefined while it's being resolved.
 */
const automaticSourceIndex = shallowRef<number>();

/**
 * Whether the version to show is still being decided: none was picked by hand and the automatic one isn't known yet
 * (there are several versions, automatic version selection is on, and the ranking hasn't arrived nor its wait limit
 * passed). Meanwhile the play button and the selectors show a loading state and can't be used, so nothing is played or
 * picked for a version that is about to change; the rest of the page doesn't wait. Once they can be used, what the page
 * shows is what plays: the version and tracks shown are played as an explicit choice.
 */
const isResolvingVersion = computed(() => isNil(selectedSource.value) && isNil(automaticSourceIndex.value));

/**
 * The version picked by the user or, if none, the automatic one (the server's first one is shown, unusable, while it's
 * being resolved). A version picked by hand is kept during the visit.
 */
const currentSource = computed({
  get: () => selectedSource.value
    ?? item.value.MediaSources?.[automaticSourceIndex.value ?? 0]
    ?? {},
  set(newValue) {
    selectedSource.value = newValue;
  }
});

const trackSelections = {
  video: currentVideoTrack,
  audio: currentAudioTrack,
  subtitle: currentSubtitleTrack
};

/**
 * Keeps a track picked by hand. Tracks belong to the version shown, so picking one also keeps that version for the
 * rest of the visit: it no longer follows the automatic one, whose later changes (a ranking that arrives after its
 * wait limit, a change of what the ranking depends on) would otherwise discard the track.
 */
function pickTrack(type: keyof typeof trackSelections, index: number): void {
  selectedSource.value ??= currentSource.value;
  trackSelections[type].value = index;
}

/**
 * How each version would be played: the displayed one with the tracks shown for it, the others with their defaults.
 * A probe stored late updates them, except while this item is being played, whose playback was negotiated without it.
 */
const { verdicts: sourceVerdicts, best, automatic } = useMediaSourceVerdicts(item, () => ({
  index: currentSourceIndex.value,
  tracks: {
    videoStreamIndex: currentVideoTrack.value,
    audioStreamIndex: displayedAudioTrack.value,
    subtitleStreamIndex: displayedSubtitleTrack.value
  }
}), () => playbackManager.currentItemId.value === item.value.Id);

watch([() => best.value, () => automatic.value], ([bestIndex, automaticIndex]) => {
  bestSourceIndex.value = bestIndex;
  automaticSourceIndex.value = automaticIndex;
}, { immediate: true });

/**
 * This page is reused when navigating between items (the route is the same), so the version
 * picked for the previous item must be discarded: it isn't one of the versions of this one.
 */
watch(() => item.value.Id, () => {
  selectedSource.value = undefined;
});

/**
 * Track indexes belong to one version: go back to the server defaults when it changes
 */
watch(() => currentSource.value.Id, () => {
  currentVideoTrack.value = undefined;
  currentAudioTrack.value = undefined;
  currentSubtitleTrack.value = undefined;
});

useItemPageTitle(item);
useItemBackdrop(item);
</script>
