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
          <div
            class="text-caption text-h4 font-weight-medium mt-2"
            :class="{ 'text-center': !$vuetify.breakpoint.mdAndUp }"
          >
            <media-info :item="item" year runtime rating ends-at />
          </div>
          <v-row
            class="my-4 align-center"
            :class="{
              'justify-center': !$vuetify.breakpoint.mdAndUp,
              'ml-1': $vuetify.breakpoint.mdAndUp
            }"
          >
            <play-button class="mr-2" :items="[item]" />
            <like-button :item="item" class="mr-2" />
            <mark-played-button :item="item" class="mr-2" />
            <item-menu :item="item" />
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
                class="px-0"
                :cols="twoColsInfoColumn.rCols"
                :sm="twoColsInfoColumn.rSm"
              >
                <v-slide-group>
                  <v-slide-item
                    v-for="(genre, index) in item.GenreItems"
                    :key="`genre-${genre.Id}`"
                  >
                    <v-chip
                      small
                      link
                      :class="{ 'ml-2': index > 0 }"
                      nuxt
                      :to="`/genre/${genre.Id}?type=${item.Type}`"
                    >
                      {{ genre.Name }}
                    </v-chip>
                  </v-slide-item>
                </v-slide-group>
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
                class="px-0"
                :cols="twoColsInfoColumn.rCols"
                :sm="twoColsInfoColumn.rSm"
              >
                <v-slide-group>
                  <v-slide-item
                    v-for="director in directors"
                    :key="director.Id"
                  >
                    <v-chip
                      small
                      link
                      nuxt
                      :to="getItemDetailsLink(director, 'Person')"
                    >
                      {{ director.Name }}
                    </v-chip>
                  </v-slide-item>
                </v-slide-group>
              </v-col>
            </v-row>
            <v-row
              v-if="item && writers.length > 0 && !$vuetify.breakpoint.smAndUp"
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
                class="px-0"
                :cols="twoColsInfoColumn.rCols"
                :sm="twoColsInfoColumn.rSm"
              >
                <v-slide-group>
                  <v-slide-item v-for="writer in writers" :key="writer.Id">
                    <v-chip
                      small
                      link
                      nuxt
                      :to="getItemDetailsLink(writer, 'Person')"
                    >
                      {{ writer.Name }}
                    </v-chip>
                  </v-slide-item>
                </v-slide-group>
              </v-col>
            </v-row>
            <div
              v-if="item && item.MediaSources && item.MediaSources.length > 0"
              class="mt-2"
            >
              <v-row v-if="item.MediaSources.length > 1" align="center">
                <v-col
                  :cols="twoColsInfoColumn.lCols"
                  :sm="twoColsInfoColumn.lSm"
                  :class="twoColsInfoColumn.lClass"
                >
                  <label class="text--secondary">{{ $t('version') }}</label>
                </v-col>
                <v-col
                  class="px-0"
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
                  class="px-0"
                  :cols="twoColsInfoColumn.rCols"
                  :sm="twoColsInfoColumn.rSm"
                >
                  <track-selector
                    :item="item"
                    :media-source-index="currentSourceIndex"
                    :type="'Video'"
                    @input="currentVideoTrack = $event"
                  />
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
                  class="px-0"
                  :cols="twoColsInfoColumn.rCols"
                  :sm="twoColsInfoColumn.rSm"
                >
                  <track-selector
                    :item="item"
                    :media-source-index="currentSourceIndex"
                    :type="'Audio'"
                    @input="currentAudioTrack = $event"
                  />
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
                  class="px-0"
                  :cols="twoColsInfoColumn.rCols"
                  :sm="twoColsInfoColumn.rSm"
                >
                  <track-selector
                    :item="item"
                    :media-source-index="currentSourceIndex"
                    :type="'Subtitle'"
                    @input="currentSubtitleTrack = $event"
                  />
                </v-col>
              </v-row>
            </div>
            <div
              v-else-if="
                item &&
                item.MediaType === 'Video' &&
                (!item.MediaSources || item.MediaSources.length === 0)
              "
              class="text-h5 my-4"
            >
              {{ $t('NoMediaSourcesAvailable') }}
            </div>
          </v-col>
          <div>
            <p
              v-if="item.Taglines && item.Taglines.length > 0"
              class="text-subtitle-1 text-truncate"
            >
              {{ item.Taglines[0] }}
            </p>
            <p class="item-overview">{{ item.Overview }}</p>
          </div>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <related-items :id="$route.params.itemId" :item="item" />
        </v-col>
      </v-row>
    </template>
    <template #right>
      <div v-if="crew.length > 0">
        <h2 class="text-h6 text-sm-h5">{{ $t('item.crew') }}</h2>
        <person-list :items="crew" />
      </div>
      <div v-if="actors.length > 0">
        <h2 class="text-h6 text-sm-h5">{{ $t('item.cast') }}</h2>
        <person-list :items="actors" />
      </div>
    </template>
  </item-cols>
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
import { Context } from '@nuxt/types';
import imageHelper from '~/mixins/imageHelper';
import formsHelper from '~/mixins/formsHelper';
import itemHelper from '~/mixins/itemHelper';
import { isValidMD5 } from '~/utils/items';

interface TwoColsInfoColumn {
  lCols: number;
  lSm: number;
  rCols: number;
  rSm: number;
  lClass: { [key: string]: boolean };
}

export default Vue.extend({
  mixins: [imageHelper, formsHelper, itemHelper],
  validate(ctx: Context) {
    return isValidMD5(ctx.route.params.itemId);
  },
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

    if (item.MediaSources && item.MediaSources.length > 0) {
      currentSource = item.MediaSources[0];
    }

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
          if (
            this.item.MediaType === 'Video' &&
            (!this.item.MediaSources || this.item.MediaSources.length === 0)
          ) {
            return false;
          }
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
  watch: {
    item: {
      handler(val: BaseItemDto): void {
        this.setPageTitle({ title: val.Name });
        const hash = this.getBlurhash(val, ImageType.Backdrop);
        this.setBackdrop({ hash });
      },
      immediate: true,
      deep: true
    }
  },
  created() {
    this.setAppBarOpacity({ opaqueAppBar: false });
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
