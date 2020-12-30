<template>
  <v-container class="ml-3 mr-3">
    <v-row>
      <v-col cols="9">
        <v-row>
          <v-col cols="3">
            <card v-if="loaded" :item="item" no-text no-margin />
            <skeleton-card v-else no-text />
          </v-col>
          <v-col cols="9">
            <h1 v-if="loaded" class="text-h4 font-weight-light text-truncate">
              {{ item.Name }}
            </h1>
            <v-skeleton-loader
              v-else
              class="mt-3 mb-2"
              type="heading"
              width="50em"
            />
            <h2
              v-if="loaded && item.OriginalTitle"
              class="text-subtitle-1 text-truncate"
            >
              {{ item.OriginalTitle }}
            </h2>
            <h2
              v-if="loaded && item.AlbumArtist"
              class="text-subtitle-1 text-truncate"
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
            <v-skeleton-loader
              v-else-if="!loaded"
              type="heading"
              width="25em"
            />
            <div class="text-caption text-h4 font-weight-medium">
              <media-info
                v-if="loaded"
                :item="item"
                year
                runtime
                rating
                ends-at
              />
              <v-skeleton-loader v-else type="text" width="50em" class="mt-2" />
            </div>
            <div class="mt-3 mb-2">
              <v-btn
                v-if="loaded && canPlay(item)"
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
              <v-skeleton-loader v-else type="button" />
              <v-btn v-if="loaded" outlined icon>
                <v-icon>mdi-dots-horizontal</v-icon>
              </v-btn>
            </div>
            <v-col class="mt-2" cols="10">
              <v-row
                v-if="
                  loaded &&
                  item &&
                  item.GenreItems &&
                  item.GenreItems.length > 0
                "
              >
                <v-col cols="2" class="d-flex align-center pa-0 flex-0">
                  <label class="text--secondary">Genres</label>
                </v-col>
                <v-col cols="7">
                  <v-chip
                    v-for="genre in item.GenreItems"
                    :key="genre.Id"
                    class="ma-2"
                    small
                    link
                    nuxt
                    :to="`/genre/${genre.Id}?type=${item.Type}`"
                  >
                    {{ genre.Name }}
                  </v-chip>
                </v-col>
              </v-row>
              <div
                v-if="
                  loaded &&
                  item &&
                  ((item.MediaSources && item.MediaSources.length > 1) ||
                    videoTracks.length > 0 ||
                    audioTracks.length > 0 ||
                    subtitleTracks.length > 0)
                "
                class="mt-2"
              >
                <v-row v-if="item.MediaSources.length > 1">
                  <v-col cols="2" class="d-flex align-center pa-0">
                    <label class="text--secondary">{{ $t('version') }}</label>
                  </v-col>
                  <v-col cols="7">
                    <v-select
                      v-model="currentSource"
                      :items="getItemizedSelect(item.MediaSources)"
                      outlined
                      filled
                      flat
                      dense
                      single-line
                      hide-details
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
                <v-row v-if="videoTracks.length > 0">
                  <v-col cols="2" class="d-flex align-center pa-0">
                    <label class="text--secondary">{{ $t('video') }}</label>
                  </v-col>
                  <v-col cols="7">
                    <v-select
                      v-model="currentVideoTrack"
                      :items="getItemizedSelect(videoTracks)"
                      :disabled="videoTracks.length <= 1"
                      outlined
                      filled
                      flat
                      dense
                      single-line
                      hide-details
                    >
                      <template slot="selection" slot-scope="{ item: i }">
                        {{ i.value.DisplayTitle }}
                      </template>
                      <template slot="item" slot-scope="{ item: i }">
                        {{ i.value.DisplayTitle }}
                      </template>
                    </v-select>
                  </v-col>
                </v-row>
                <v-row v-if="audioTracks.length > 0">
                  <v-col cols="2" class="d-flex align-center pa-0">
                    <label class="text--secondary">{{ $t('audio') }}</label>
                  </v-col>
                  <v-col cols="7">
                    <v-select
                      v-if="audioTracks.length > 0"
                      v-model="currentAudioTrack"
                      :items="getItemizedSelect(audioTracks)"
                      :disabled="audioTracks.length <= 1"
                      outlined
                      filled
                      flat
                      dense
                      single-line
                      hide-details
                    >
                      <template slot="selection" slot-scope="{ item: i }">
                        {{ i.value.DisplayTitle }}
                      </template>
                      <template slot="item" slot-scope="{ item: i, on, attrs }">
                        <v-list-item v-bind="attrs" two-line v-on="on">
                          <v-list-item-avatar>
                            <v-icon
                              v-text="getSurroundIcon(i.value.ChannelLayout)"
                            ></v-icon>
                          </v-list-item-avatar>
                          <v-list-item-content>
                            <v-list-item-title>{{
                              i.value.DisplayTitle
                            }}</v-list-item-title>
                            <v-list-item-subtitle>
                              {{ getLanguageName(i.value.Language) }}
                            </v-list-item-subtitle>
                          </v-list-item-content>
                        </v-list-item>
                      </template>
                    </v-select>
                  </v-col>
                </v-row>
                <v-row v-if="subtitleTracks.length > 0">
                  <v-col cols="2" class="d-flex align-center pa-0">
                    <label class="text--secondary">{{ $t('subtitles') }}</label>
                  </v-col>
                  <v-col cols="7">
                    <v-select
                      v-if="subtitleTracks.length > 0"
                      v-model="currentSubtitleTrack"
                      :items="getItemizedSelect(subtitleTracks)"
                      outlined
                      filled
                      flat
                      dense
                      single-line
                      hide-details
                    >
                      <template slot="selection" slot-scope="{ item: i }">
                        {{ i.value.DisplayTitle }}
                      </template>
                      <template slot="item" slot-scope="{ item: i, on, attrs }">
                        <v-list-item v-bind="attrs" two-line v-on="on">
                          <v-list-item-content>
                            <v-list-item-title>{{
                              i.value.DisplayTitle
                            }}</v-list-item-title>
                            <v-list-item-subtitle>
                              {{ getLanguageName(i.value.Language) }}
                            </v-list-item-subtitle>
                          </v-list-item-content>
                        </v-list-item>
                      </template>
                    </v-select>
                  </v-col>
                </v-row>
              </div>
            </v-col>
            <div>
              <p
                v-if="loaded && item.Taglines"
                class="text-subtitle-1 text-truncate"
              >
                {{ item.Taglines[0] }}
              </p>
              <v-skeleton-loader v-else type="text" width="25em" class="mb-4" />
              <p v-if="loaded" class="item-overview">{{ item.Overview }}</p>
              <div v-else>
                <v-skeleton-loader
                  v-for="index in 2"
                  :key="index"
                  type="sentences"
                />
              </div>
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
      <v-col cols="3">
        <div v-if="crew.length > 0">
          <h2 v-if="loaded">Crew</h2>
          <v-skeleton-loader v-else type="heading" />
          <person-list :items="crew" :skeleton-length="3" />
        </div>
        <div v-if="actors.length > 0">
          <h2 v-if="loaded">Cast</h2>
          <v-skeleton-loader v-else type="heading" />
          <person-list :items="actors" :skeleton-length="5" />
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
// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- Temporary module while waiting for fixes to language names on the server
// @ts-ignore
import langs from 'langs';
import {
  BaseItemDto,
  BaseItemPerson,
  MediaSourceInfo,
  MediaStream
} from '@jellyfin/client-axios';
import imageHelper from '~/mixins/imageHelper';
import formsHelper from '~/mixins/formsHelper';
import itemHelper from '~/mixins/itemHelper';

export default Vue.extend({
  mixins: [imageHelper, formsHelper, itemHelper],
  data() {
    return {
      loaded: false,
      item: {} as BaseItemDto,
      parentItem: {} as BaseItemDto,
      backdropImageSource: '',
      currentSource: {} as MediaSourceInfo,
      videoTracks: [] as MediaStream[],
      currentVideoTrack: {} as MediaStream,
      audioTracks: [] as MediaStream[],
      currentAudioTrack: {} as MediaStream,
      subtitleTracks: [] as MediaStream[],
      currentSubtitleTrack: {} as MediaStream
    };
  },
  computed: {
    isPlayable: {
      get(): boolean {
        // TODO: Move this to a mixin
        if (['PhotoAlbum', 'Photo', 'Book'].includes(this.$data.item.Type)) {
          return false;
        } else {
          return true;
        }
      }
    },
    crew: {
      get(): BaseItemPerson[] {
        if (this.$data.item.People) {
          // TODO: Figure out how common it is to have more than one director
          return this.$data.item.People.filter((person: BaseItemPerson) => {
            return ['Director', 'Writer'].includes(person.Type || '');
          });
        } else {
          return [];
        }
      }
    },
    actors: {
      get(): BaseItemPerson[] {
        if (this.$data.item.People) {
          return this.$data.item.People.filter((person: BaseItemPerson) => {
            return person.Type === 'Actor';
          }).slice(0, 10);
        } else {
          return [];
        }
      }
    }
  },
  async beforeMount() {
    this.item = (
      await this.$api.userLibrary.getItem({
        userId: this.$auth.user.Id,
        itemId: this.$route.params.itemId
      })
    ).data;

    if (this.item) {
      this.setBackdrop({ item: this.item });

      if (this.item.MediaSources) {
        this.currentSource = this.item.MediaSources[0];

        // Filter the streams to get each type of track
        if (this.currentSource.MediaStreams) {
          this.videoTracks = this.currentSource.MediaStreams.filter(
            (stream: MediaStream) => {
              return stream.Type === 'Video';
            }
          );
          this.audioTracks = this.currentSource.MediaStreams.filter(
            (stream: MediaStream) => {
              return stream.Type === 'Audio';
            }
          );
          this.subtitleTracks = this.currentSource.MediaStreams.filter(
            (stream: MediaStream) => {
              return stream.Type === 'Subtitle';
            }
          );

          // Set default tracks
          if (this.videoTracks.length > 0) {
            this.currentVideoTrack = this.videoTracks[0];
          }
          if (
            this.audioTracks.length > 0 &&
            this.currentSource.DefaultAudioStreamIndex
          ) {
            this.currentAudioTrack = this.audioTracks[
              this.currentSource.DefaultAudioStreamIndex - 1
            ];
          } else if (this.audioTracks.length > 0) {
            this.currentAudioTrack = this.audioTracks[0];
          }
          if (
            this.subtitleTracks.length > 0 &&
            this.currentSource.DefaultSubtitleStreamIndex
          ) {
            this.currentSubtitleTrack = this.subtitleTracks[
              this.currentSource.DefaultSubtitleStreamIndex - 1
            ];
          }
        }
      }

      this.loaded = true;
    }
  },
  destroyed() {
    this.clearBackdrop();
  },
  methods: {
    ...mapActions('playbackManager', ['play']),
    ...mapActions('backdrop', ['setBackdrop', 'clearBackdrop']),
    getLanguageName(code?: string): string {
      if (!code) {
        return this.$t('undefined').toString();
      }
      return langs.where('2B', code).name;
    },
    getSurroundIcon(layout: string): string {
      switch (layout) {
        case '2.0':
          return 'mdi-surround-sound-2-0';
        case '3.1':
          return 'mdi-surround-sound-3-1';
        case '5.1':
          return 'mdi-surround-sound-5-1';
        case '7.1':
          return 'mdi-surround-sound-7-1';
        default:
          return 'mdi-surround-sound';
      }
    }
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
