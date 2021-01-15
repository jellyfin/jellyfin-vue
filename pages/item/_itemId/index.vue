<template>
  <v-container class="px-6">
    <v-row>
      <v-col cols="12" sm="8" md="9">
        <v-row justify="center" justify-md="start">
          <v-col cols="7" md="3">
            <card :item="item" no-text no-margin />
          </v-col>
          <v-col cols="12" md="9">
            <h1
              class="text-h4 font-weight-light"
              :class="{ 'text-center': !$vuetify.breakpoint.mdAndUp }"
            >
              {{ item.Name }}
            </h1>
            <h2
              v-if="item.OriginalTitle"
              class="text-subtitle-1"
              :class="{ 'text-center': !$vuetify.breakpoint.mdAndUp }"
            >
              {{ item.OriginalTitle }}
            </h2>
            <h2
              v-if="item.AlbumArtist"
              class="text-subtitle-1 text-truncate mt-2"
              :class="{ 'text-center': !$vuetify.breakpoint.mdAndUp }"
            >
              {{ $t('byArtist') }}
              <nuxt-link
                tag="span"
                class="link"
                :to="`/artist/${item.AlbumArtists[0].Id}`"
              >
                {{ item.AlbumArtist }}
              </nuxt-link>
            </h2>
            <div
              class="text-caption text-h4 font-weight-medium mt-2"
              :class="{ 'text-center': !$vuetify.breakpoint.mdAndUp }"
            >
              <media-info :item="item" year runtime rating ends-at />
            </div>
            <v-row
              class="mt-4 align-center"
              :class="{ 'justify-center': !$vuetify.breakpoint.mdAndUp }"
            >
              <v-btn
                v-if="canPlay(item)"
                class="play-button mr-2"
                color="primary"
                min-width="8em"
                :disabled="!isPlayable"
                depressed
                rounded
                @click="play({ items: [item] })"
              >
                {{ $t('play') }}
              </v-btn>
              <item-menu :item="item" outlined :absolute="false" />
            </v-row>
            <v-col cols="12" md="10">
              <v-row
                v-if="item && item.GenreItems && item.GenreItems.length > 0"
                align="center"
              >
                <v-col
                  :cols="twoColsInfoColumn.lCols"
                  :sm="twoColsInfoColumn.lSm"
                  :class="twoColsInfoColumn.lClass"
                >
                  <label class="text--secondary">{{ $t('genres') }}</label>
                </v-col>
                <v-col
                  :cols="twoColsInfoColumn.rCols"
                  :sm="twoColsInfoColumn.rSm"
                >
                  <v-row dense>
                    <v-col
                      v-for="genre in item.GenreItems"
                      :key="genre.Id"
                      cols="auto"
                    >
                      <v-chip
                        small
                        link
                        nuxt
                        :to="`/genre/${genre.Id}?type=${item.Type}`"
                      >
                        {{ genre.Name }}
                      </v-chip>
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
              <v-row
                v-if="
                  item && directors.length > 0 && !$vuetify.breakpoint.smAndUp
                "
                align="center"
              >
                <v-col
                  :cols="twoColsInfoColumn.lCols"
                  :sm="twoColsInfoColumn.lSm"
                  :class="twoColsInfoColumn.lClass"
                >
                  <label class="text--secondary">{{ $t('directing') }}</label>
                </v-col>
                <v-col
                  :cols="twoColsInfoColumn.rCols"
                  :sm="twoColsInfoColumn.rSm"
                >
                  <v-row dense>
                    <v-col
                      v-for="director in directors"
                      :key="director.Id"
                      cols="auto"
                    >
                      <v-chip small link nuxt :to="`/person/${director.Id}`">{{
                        director.Name
                      }}</v-chip>
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
              <v-row
                v-if="
                  item && writers.length > 0 && !$vuetify.breakpoint.smAndUp
                "
                align="center"
              >
                <v-col
                  :cols="twoColsInfoColumn.lCols"
                  :sm="twoColsInfoColumn.lSm"
                  :class="twoColsInfoColumn.lClass"
                >
                  <label class="text--secondary">{{ $t('writing') }}</label>
                </v-col>
                <v-col
                  :cols="twoColsInfoColumn.rCols"
                  :sm="twoColsInfoColumn.rSm"
                >
                  <v-row dense>
                    <v-col
                      v-for="writer in writers"
                      :key="writer.Id"
                      cols="auto"
                    >
                      <v-chip small link nuxt :to="`/person/${writer.Id}`">{{
                        writer.Name
                      }}</v-chip>
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
              <div v-if="item && item.MediaSources" class="mt-2">
                <v-row v-if="item.MediaSources.length > 1" align="center">
                  <v-col
                    :cols="twoColsInfoColumn.lCols"
                    :sm="twoColsInfoColumn.lSm"
                    :class="twoColsInfoColumn.lClass"
                  >
                    <label class="text--secondary">{{ $t('version') }}</label>
                  </v-col>
                  <v-col
                    :cols="twoColsInfoColumn.rCols"
                    :sm="twoColsInfoColumn.rSm"
                  >
                    <v-select
                      v-model="currentSource"
                      :items="getItemizedSelect(item.MediaSources)"
                      outlined
                      filled
                      flat
                      dense
                      single-line
                      hide-details
                      class="text-truncate"
                    >
                      <template slot="selection" slot-scope="{ item: i }">
                        {{ i.value.Name }}
                      </template>
                      <template slot="item" slot-scope="{ item: i }">
                        {{ i.value.Name }}
                      </template>
                    </v-select>
                  </v-col>
                </v-row>
                <v-row align="center">
                  <v-col
                    :cols="twoColsInfoColumn.lCols"
                    :sm="twoColsInfoColumn.lSm"
                    :class="twoColsInfoColumn.lClass"
                  >
                    <label class="text--secondary">{{ $t('video') }}</label>
                  </v-col>
                  <v-col
                    :cols="twoColsInfoColumn.rCols"
                    :sm="twoColsInfoColumn.rSm"
                  >
                    <track-selector
                      :item="item"
                      :media-source-index="currentSourceIndex"
                      :type="'Video'"
                      @input="currentVideoTrack = $event"
                    ></track-selector>
                  </v-col>
                </v-row>
                <v-row align="center">
                  <v-col
                    :cols="twoColsInfoColumn.lCols"
                    :sm="twoColsInfoColumn.lSm"
                    :class="twoColsInfoColumn.lClass"
                  >
                    <label class="text--secondary">{{ $t('audio') }}</label>
                  </v-col>
                  <v-col
                    :cols="twoColsInfoColumn.rCols"
                    :sm="twoColsInfoColumn.rSm"
                  >
                    <track-selector
                      :item="item"
                      :media-source-index="currentSourceIndex"
                      :type="'Audio'"
                      @input="currentAudioTrack = $event"
                    ></track-selector>
                  </v-col>
                </v-row>
                <v-row align="center">
                  <v-col
                    :cols="twoColsInfoColumn.lCols"
                    :sm="twoColsInfoColumn.lSm"
                    :class="twoColsInfoColumn.lClass"
                  >
                    <label class="text--secondary">{{ $t('subtitles') }}</label>
                  </v-col>
                  <v-col
                    :cols="twoColsInfoColumn.rCols"
                    :sm="twoColsInfoColumn.rSm"
                  >
                    <track-selector
                      :item="item"
                      :media-source-index="currentSourceIndex"
                      :type="'Subtitle'"
                      @input="currentSubtitleTrack = $event"
                    ></track-selector>
                  </v-col>
                </v-row>
              </div>
            </v-col>
            <div>
              <p v-if="item.Taglines" class="text-subtitle-1 text-truncate">
                {{ item.Taglines[0] }}
              </p>
              <p class="item-overview">{{ item.Overview }}</p>
            </div>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <related-items
              v-if="item.Type === 'Movie'"
              :id="$route.params.itemId"
              :item="item"
            />
            <season-tabs
              v-if="item.Type === 'Series'"
              :item="item"
            ></season-tabs>
            <track-list
              v-if="item.Type === 'MusicAlbum'"
              :item="item"
            ></track-list>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="12" sm="4" md="3">
        <div v-if="crew.length > 0">
          <h2>Crew</h2>
          <person-list :items="crew" />
        </div>
        <div v-if="actors.length > 0">
          <h2>Cast</h2>
          <person-list :items="actors" />
        </div>
        <related-items
          v-if="['Series', 'MusicAlbum'].includes(item.Type)"
          :item="item"
          vertical
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';
import {
  BaseItemDto,
  BaseItemPerson,
  ImageType,
  MediaSourceInfo
} from '@jellyfin/client-axios';
import imageHelper from '~/mixins/imageHelper';
import formsHelper from '~/mixins/formsHelper';
import itemHelper from '~/mixins/itemHelper';
import TrackSelector from '~/components/Item/TrackSelector.vue';

interface TwoColsInfoColumn {
  lCols: number;
  lSm: number;
  rCols: number;
  rSm: number;
  lClass: { [key: string]: boolean };
}

export default Vue.extend({
  components: { TrackSelector },
  mixins: [imageHelper, formsHelper, itemHelper],
  async asyncData({ params, $api, $auth }) {
    const item = (
      await $api.userLibrary.getItem({
        userId: $auth.user?.Id,
        itemId: params.itemId
      })
    ).data;

    let crew: BaseItemPerson[] = [];
    if (item.People) {
      crew = item.People.filter((person: BaseItemPerson) => {
        return ['Director', 'Writer'].includes(person.Type || '');
      });
    }

    let currentSource: MediaSourceInfo = {};

    if (item.MediaSources && item.MediaSources.length > 0)
      currentSource = item.MediaSources[0];

    return {
      item,
      crew,
      currentSource
    };
  },
  data() {
    return {
      item: {} as BaseItemDto,
      crew: [] as BaseItemPerson[],
      parentItem: {} as BaseItemDto,
      backdropImageSource: '',
      currentSource: {} as MediaSourceInfo,
      currentVideoTrack: undefined as number | undefined,
      currentAudioTrack: undefined as number | undefined,
      currentSubtitleTrack: undefined as number | undefined
    };
  },
  head() {
    return {
      title: this.$store.state.page.title
    };
  },
  computed: {
    twoColsInfoColumn: {
      get(): TwoColsInfoColumn {
        return {
          lCols: 12,
          lSm: 2,
          lClass: {
            'mt-3': !this.$vuetify.breakpoint.smAndUp,
            'py-0': !this.$vuetify.breakpoint.smAndUp,
            'px-0': true,
            'text-truncate': true
          },
          rCols: 12,
          rSm: 10
        };
      }
    },
    currentSourceIndex: {
      get(): number | undefined {
        return this.item.MediaSources?.findIndex(
          (source) => source === this.currentSource
        );
      }
    },
    isPlayable: {
      get(): boolean {
        // TODO: Move this to a mixin
        if (
          ['PhotoAlbum', 'Photo', 'Book'].includes(this.item.Type as string)
        ) {
          return false;
        } else {
          return true;
        }
      }
    },
    actors: {
      get(): BaseItemPerson[] {
        if (this.item.People) {
          return this.item.People.filter((person: BaseItemPerson) => {
            return person.Type === 'Actor';
          }).slice(0, 10);
        } else {
          return [];
        }
      }
    },
    directors: {
      get(): BaseItemPerson[] {
        return this.crew.filter(
          (person: BaseItemPerson) => person.Type === 'Director'
        );
      }
    },
    writers: {
      get(): BaseItemPerson[] {
        return this.crew.filter(
          (person: BaseItemPerson) => person.Type === 'Writer'
        );
      }
    }
  },
  beforeMount() {
    if (this.item) {
      this.setPageTitle({ title: this.item.Name });
      this.setAppBarOpacity({ opaqueAppBar: false });
      const hash = this.getBlurhash(this.item, ImageType.Backdrop);
      this.setBackdrop({ hash });
    }
  },
  destroyed() {
    this.setAppBarOpacity({ opaqueAppBar: true });
    this.clearBackdrop();
  },
  methods: {
    ...mapActions('playbackManager', ['play']),
    ...mapActions('page', ['setPageTitle', 'setAppBarOpacity']),
    ...mapActions('backdrop', ['setBackdrop', 'clearBackdrop'])
  }
});
</script>

<style lang="scss" scoped>
.link {
  cursor: pointer;
}
.link:hover {
  text-decoration: underline;
}
.flex-0 {
  flex: 0;
}
</style>
