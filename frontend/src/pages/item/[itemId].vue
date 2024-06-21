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
            :class="{ 'text-center': !$vuetify.display.mdAndUp }">
            {{ item.Name }}
          </h1>
          <h2
            v-if="item.OriginalTitle && item.OriginalTitle !== item.Name"
            class="text-subtitle-1"
            :class="{ 'text-center': !$vuetify.display.mdAndUp }">
            {{ item.OriginalTitle }}
          </h2>
          <h3
            v-if="currentSeries"
            class="text-h6 font-weight-heavy"
            :class="{'text-center': !$vuetify.display.mdAndUp }">
            <RouterLink
              class="link d-block font-weight-medium pa-0 mt-1 text-truncate"
              :to="getItemDetailsLink(currentSeries)">
              {{ currentSeries.Name }}
            </RouterLink>
          </h3>
          <div
            class="text-caption text-h4 font-weight-medium mt-2"
            :class="{ 'text-center': !$vuetify.display.mdAndUp }">
            <MediaInfo
              :item="item"
              year
              runtime
              rating
              ends-at />
          </div>
          <VRow
            class="my-4 align-center"
            :class="{
              'justify-center': !$vuetify.display.mdAndUp,
              'ml-0': $vuetify.display.mdAndUp
            }">
            <PlayButton
              class="mr-2"
              :item="item"
              :media-source-index="currentSourceIndex"
              :video-track-index="currentVideoTrack"
              :audio-track-index="currentAudioTrack"
              :subtitle-track-index="currentSubtitleTrack" />
            <LikeButton
              :item="item"
              class="mr-2" />
            <MarkPlayedButton
              :item="item"
              class="mr-2" />
            <ItemMenu
              :item="item"
              :media-source-index="currentSourceIndex" />
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
                class="px-0 text-truncate">
                <label class="text--secondary">{{ $t('genres') }}</label>
              </VCol>
              <VCol
                class="px-0"
                :cols="12"
                :sm="10">
                <VSlideGroup>
                  <VSlideGroupItem
                    v-for="(genre, index) in item.GenreItems"
                    :key="`genre-${genre.Id}`">
                    <VChip
                      size="small"
                      link
                      :class="{ 'ml-2': index > 0 }"
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
                class="mt-sm-3 py-sm-0 px-0 text-truncate">
                <label class="text--secondary">{{ $t('directing') }}</label>
              </VCol>
              <VCol
                class="px-0"
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
                class="mt-sm-3 py-sm-0 px-0 text-truncate">
                <label class="text--secondary">{{ $t('writing') }}</label>
              </VCol>
              <VCol
                class="px-0"
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
                  class="mt-sm-3 py-sm-0 px-0 text-truncate">
                  <label class="text--secondary">{{ $t('version') }}</label>
                </VCol>
                <VCol
                  class="px-0"
                  :cols="12"
                  :sm="10">
                  <MediaSourceSelector
                    :sources="item.MediaSources"
                    :default-source-index="currentSourceIndex"
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
                  class="mt-sm-3 py-sm-0 px-0 text-truncate">
                  <label class="text--secondary">{{ $t('video') }}</label>
                </VCol>
                <VCol
                  class="px-0"
                  :cols="12"
                  :sm="10">
                  <MediaStreamSelector
                    v-if="currentSource.MediaStreams"
                    :key="currentSource.Id || ''"
                    :media-streams="
                      getMediaStreams(currentSource.MediaStreams, 'Video')
                    "
                    type="Video"
                    @input="(trackIndex) => (currentVideoTrack = trackIndex)" />
                </VCol>
              </VRow>
              <VRow align="center">
                <VCol
                  :cols="12"
                  :sm="2"
                  class="mt-sm-3 py-sm-0 px-0 text-truncate">
                  <label class="text--secondary">{{ $t('audio') }}</label>
                </VCol>
                <VCol
                  class="px-0"
                  :cols="12"
                  :sm="10">
                  <MediaStreamSelector
                    v-if="currentSource.MediaStreams"
                    :key="currentSource.Id || ''"
                    :media-streams="
                      getMediaStreams(currentSource.MediaStreams, 'Audio')
                    "
                    type="Audio"
                    @input="(trackIndex) => (currentAudioTrack = trackIndex)" />
                </VCol>
              </VRow>
              <VRow align="center">
                <VCol
                  :cols="12"
                  :sm="2"
                  class="mt-sm-3 py-sm-0 px-0 text-truncate">
                  <label class="text--secondary">{{ $t('subtitles') }}</label>
                </VCol>
                <VCol
                  class="px-0"
                  :cols="12"
                  :sm="10">
                  <MediaStreamSelector
                    v-if="currentSource.MediaStreams"
                    :key="currentSource.Id || ''"
                    :media-streams="
                      getMediaStreams(currentSource.MediaStreams, 'Subtitle')
                    "
                    type="Subtitle"
                    @input="
                      (trackIndex) => (currentSubtitleTrack = trackIndex)
                    " />
                </VCol>
              </VRow>
            </div>
            <div
              v-else-if="
                item &&
                  item.MediaType === 'Video' &&
                  (!item.MediaSources || item.MediaSources.length === 0)
              "
              class="text-h5 my-4">
              {{ $t('NoMediaSourcesAvailable') }}
            </div>
          </VCol>
          <div>
            <p
              v-if="item.Taglines && item.Taglines.length"
              class="text-subtitle-1 text-truncate">
              {{ item.Taglines[0] }}
            </p>
            <p
              v-if="item.Overview"
              class="item-overview">
              <JSafeHtml :html="item.Overview" markdown />
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
import {
  ImageType,
  type BaseItemPerson,
  type MediaSourceInfo
} from '@jellyfin/sdk/lib/generated-client';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { getItemDetailsLink, getMediaStreams } from '@/utils/items';
import { getBlurhash } from '@/utils/images';
import { getItemizedSelect } from '@/utils/forms';
import { useBaseItem } from '@/composables/apis';

const route = useRoute('/genre/[itemId]');

const { data: item } = await useBaseItem(getUserLibraryApi, 'getItem')(() => ({
  itemId: route.params.itemId
}));
const { data: relatedItems } = await useBaseItem(getLibraryApi, 'getSimilarItems')(() => ({
  itemId: route.params.itemId,
  limit: 12
}));
const { data: currentSeries } = await useBaseItem(getUserLibraryApi, 'getItem')(
  () => ({
    itemId: item.value.SeriesId ?? ''
  })
);
const { data: childItems } = await useBaseItem(getItemsApi, 'getItems')(
  () => ({
    parentId: item.value.Id
  })
);

const selectedSource = ref<MediaSourceInfo>();
const currentVideoTrack = ref<number>();
const currentAudioTrack = ref<number>();
const currentSubtitleTrack = ref<number>();

const crew = computed<BaseItemPerson[]>(() =>
  (item.value.People ?? []).filter(person =>
    ['Director', 'Writer'].includes(person.Type ?? '')
  )
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

const currentSource = computed({
  get() {
    return selectedSource.value ?? item.value.MediaSources?.[0] ?? {};
  },
  set(newValue) {
    selectedSource.value = newValue;
  }
});

route.meta.title = item.value.Name;
route.meta.layout.backdrop.blurhash = getBlurhash(item.value, ImageType.Backdrop);
</script>
