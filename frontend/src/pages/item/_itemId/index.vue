<template>
  <item-cols>
    <template #left>
      <v-row justify="center" justify-md="start">
        <v-col cols="6" md="3">
          <card :item="item" />
        </v-col>
        <v-col cols="12" md="9">
          <h1
            class="text-h5 text-sm-h4 font-weight-light"
            :class="{ 'text-center': !$vuetify.display.mdAndUp }">
            {{ item.Name }}
          </h1>
          <h2
            v-if="item.OriginalTitle && item.OriginalTitle !== item.Name"
            class="text-subtitle-1"
            :class="{ 'text-center': !$vuetify.display.mdAndUp }">
            {{ item.OriginalTitle }}
          </h2>
          <div
            class="text-caption text-h4 font-weight-medium mt-2"
            :class="{ 'text-center': !$vuetify.display.mdAndUp }">
            <media-info :item="item" year runtime rating ends-at />
          </div>
          <v-row
            class="my-4 align-center"
            :class="{
              'justify-center': !$vuetify.display.mdAndUp,
              'ml-0': $vuetify.display.mdAndUp
            }">
            <play-button
              class="mr-2"
              :item="item"
              :video-track-index="currentVideoTrack"
              :audio-track-index="currentAudioTrack"
              :subtitle-track-index="currentSubtitleTrack" />
            <like-button :item="item" class="mr-2" />
            <mark-played-button :item="item" class="mr-2" />
            <item-menu :item="item" />
          </v-row>
          <v-col cols="12" md="10">
            <v-row
              v-if="item && item.GenreItems && item.GenreItems.length > 0"
              align="center">
              <v-col :cols="12" :sm="2" class="px-0 text-truncate">
                <label class="text--secondary">{{ $t('genres') }}</label>
              </v-col>
              <v-col class="px-0" :cols="12" :sm="10">
                <v-slide-group>
                  <v-slide-group-item
                    v-for="(genre, index) in item.GenreItems"
                    :key="`genre-${genre.Id}`">
                    <v-chip
                      small
                      link
                      :class="{ 'ml-2': index > 0 }"
                      :to="`/genre/${genre.Id}?type=${item.Type}`">
                      {{ genre.Name }}
                    </v-chip>
                  </v-slide-group-item>
                </v-slide-group>
              </v-col>
            </v-row>
            <v-row
              v-if="item && directors.length > 0 && !$vuetify.display.smAndUp"
              align="center">
              <v-col
                :cols="12"
                :sm="2"
                class="mt-sm-3 py-sm-0 px-0 text-truncate">
                <label class="text--secondary">{{ $t('directing') }}</label>
              </v-col>
              <v-col class="px-0" :cols="12" :sm="10">
                <v-slide-group>
                  <v-slide-group-item
                    v-for="director in directors"
                    :key="director.Id">
                    <v-chip
                      small
                      link
                      :to="getItemDetailsLink(director, 'Person')">
                      {{ director.Name }}
                    </v-chip>
                  </v-slide-group-item>
                </v-slide-group>
              </v-col>
            </v-row>
            <v-row
              v-if="item && writers.length > 0 && !$vuetify.display.smAndUp"
              align="center">
              <v-col
                :cols="12"
                :sm="2"
                class="mt-sm-3 py-sm-0 px-0 text-truncate">
                <label class="text--secondary">{{ $t('writing') }}</label>
              </v-col>
              <v-col class="px-0" :cols="12" :sm="10">
                <v-slide-group>
                  <v-slide-group-item
                    v-for="writer in writers"
                    :key="writer.Id">
                    <v-chip
                      small
                      link
                      :to="getItemDetailsLink(writer, 'Person')">
                      {{ writer.Name }}
                    </v-chip>
                  </v-slide-group-item>
                </v-slide-group>
              </v-col>
            </v-row>
            <div
              v-if="item && item.MediaSources && item.MediaSources.length > 0"
              class="mt-2">
              <v-row v-if="item.MediaSources.length > 1" align="center">
                <v-col
                  :cols="12"
                  :sm="2"
                  class="mt-sm-3 py-sm-0 px-0 text-truncate">
                  <label class="text--secondary">{{ $t('version') }}</label>
                </v-col>
                <v-col class="px-0" :cols="12" :sm="10">
                  <v-select
                    v-model="currentSource"
                    :items="getItemizedSelect(item.MediaSources)"
                    flat
                    dense
                    single-line
                    hide-details
                    class="text-truncate">
                    <template #selection="{ item: i }">
                      {{ i.value.Name }}
                    </template>
                    <template #item="{ item: i }">
                      {{ i.value.Name }}
                    </template>
                  </v-select>
                </v-col>
              </v-row>
              <v-row align="center">
                <v-col
                  :cols="12"
                  :sm="2"
                  class="mt-sm-3 py-sm-0 px-0 text-truncate">
                  <label class="text--secondary">{{ $t('video') }}</label>
                </v-col>
                <v-col class="px-0" :cols="12" :sm="10">
                  <media-stream-selector
                    v-if="currentSource.MediaStreams"
                    :media-streams="
                      getMediaStreams(currentSource.MediaStreams, 'Video')
                    "
                    type="Video"
                    @input="currentVideoTrack = $event" />
                </v-col>
              </v-row>
              <v-row align="center">
                <v-col
                  :cols="12"
                  :sm="2"
                  class="mt-sm-3 py-sm-0 px-0 text-truncate">
                  <label class="text--secondary">{{ $t('audio') }}</label>
                </v-col>
                <v-col class="px-0" :cols="12" :sm="10">
                  <media-stream-selector
                    v-if="currentSource.MediaStreams"
                    :media-streams="
                      getMediaStreams(currentSource.MediaStreams, 'Audio')
                    "
                    type="Audio"
                    @input="currentAudioTrack = $event" />
                </v-col>
              </v-row>
              <v-row align="center">
                <v-col
                  :cols="12"
                  :sm="2"
                  class="mt-sm-3 py-sm-0 px-0 text-truncate">
                  <label class="text--secondary">{{ $t('subtitles') }}</label>
                </v-col>
                <v-col class="px-0" :cols="12" :sm="10">
                  <media-stream-selector
                    v-if="currentSource.MediaStreams"
                    :media-streams="
                      getMediaStreams(currentSource.MediaStreams, 'Subtitle')
                    "
                    type="Subtitle"
                    @input="currentSubtitleTrack = $event" />
                </v-col>
              </v-row>
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
          </v-col>
          <div>
            <p
              v-if="item.Taglines && item.Taglines.length > 0"
              class="text-subtitle-1 text-truncate">
              {{ item.Taglines[0] }}
            </p>
            <p class="item-overview">{{ item.Overview }}</p>
          </div>
        </v-col>
      </v-row>
      <v-row>
        <v-col v-if="item.Type === 'BoxSet'" cols="12">
          <collection-tabs :item="item" />
        </v-col>
        <v-col cols="12">
          <related-items :id="$route.params.itemId" :item="item" />
        </v-col>
      </v-row>
    </template>
    <template #right>
      <div v-if="crew.length > 0">
        <h2 class="text-h6 text-sm-h5">{{ $t('item.crew') }}</h2>
        <people-list :items="crew" />
      </div>
      <div v-if="actors.length > 0">
        <h2 class="text-h6 text-sm-h5">{{ $t('item.cast') }}</h2>
        <people-list :items="actors" />
      </div>
    </template>
  </item-cols>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useRoute } from 'vue-router';
import {
  BaseItemDto,
  BaseItemPerson,
  ImageType,
  MediaSourceInfo
} from '@jellyfin/sdk/lib/generated-client';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { getBlurhash } from '~/utils/images';
import { getItemDetailsLink, getMediaStreams } from '~/utils/items';
import { getItemizedSelect } from '~/utils/forms';
import { useRemote } from '@/composables';

export default defineComponent({
  async setup() {
    const { params } = useRoute();
    const itemId = params.itemId;
    const remote = useRemote();
    const item = (
      await remote.sdk.newUserApi(getUserLibraryApi).getItem({
        userId: remote.auth.currentUserId.value || '',
        itemId
      })
    ).data;

    return { item };
  },
  data() {
    return {
      backdropImageSource: '',
      currentSource: {} as MediaSourceInfo,
      currentVideoTrack: undefined as number | undefined,
      currentAudioTrack: undefined as number | undefined,
      currentSubtitleTrack: undefined as number | undefined
    };
  },
  computed: {
    isPlayable(): boolean {
      // TODO: Move this to a mixin
      return ['PhotoAlbum', 'Photo', 'Book'].includes(this.item.Type as string)
        ? false
        : !(
            this.item.MediaType === 'Video' &&
            (!this.item.MediaSources || this.item.MediaSources.length === 0)
          );
    },
    crew(): BaseItemPerson[] {
      let crew: BaseItemPerson[] = [];

      if (this.item.People) {
        crew = this.item.People.filter((person: BaseItemPerson) => {
          return ['Director', 'Writer'].includes(person.Type || '');
        });
      }

      return crew;
    },
    actors(): BaseItemPerson[] {
      return this.item.People
        ? this.item.People.filter((person: BaseItemPerson) => {
            return person.Type === 'Actor';
          }).slice(0, 10)
        : [];
    },
    directors(): BaseItemPerson[] {
      return this.crew.filter(
        (person: BaseItemPerson) => person.Type === 'Director'
      );
    },
    writers(): BaseItemPerson[] {
      return this.crew.filter(
        (person: BaseItemPerson) => person.Type === 'Writer'
      );
    }
  },
  watch: {
    item: {
      handler(value: BaseItemDto): void {
        this.$route.meta.title = value.Name || '';

        this.$route.meta.backdrop.blurhash = getBlurhash(
          value,
          ImageType.Backdrop
        );
      },
      immediate: true,
      deep: true
    }
  },
  mounted() {
    if (this.item.MediaSources && this.item.MediaSources.length > 0) {
      this.currentSource = this.item.MediaSources[0];
    }
  },
  methods: {
    getItemDetailsLink,
    getMediaStreams,
    getItemizedSelect
  }
});
</script>

<style lang="scss" scoped>
:deep(.v-slide-group__prev--disabled),
:deep(.v-slide-group__next--disabled) {
  display: none !important;
}
</style>
