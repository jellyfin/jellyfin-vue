<template>
  <item-cols>
    <template #left>
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
            v-if="item.AlbumArtist"
            class="text-subtitle-1 text-truncate mt-2"
            :class="{ 'text-center': !$vuetify.breakpoint.mdAndUp }"
          >
            {{ $t('byArtist') }}
            <nuxt-link
              tag="span"
              class="link"
              :to="getItemDetailsLink(item.AlbumArtist[0])"
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
            class="my-4 align-center"
            :class="{
              'justify-center': !$vuetify.breakpoint.mdAndUp,
              'ml-1': $vuetify.breakpoint.mdAndUp
            }"
          >
            <v-btn
              v-if="canPlay(item)"
              class="play-button mr-2"
              color="primary"
              min-width="8em"
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
          </v-col>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <track-list v-if="item.Type === 'MusicAlbum'" :item="item" />
        </v-col>
      </v-row>
    </template>
    <template #right>
      <related-items :item="item" vertical />
    </template>
  </item-cols>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';
import { BaseItemDto, ImageType } from '@jellyfin/client-axios';
import imageHelper from '~/mixins/imageHelper';
import formsHelper from '~/mixins/formsHelper';
import itemHelper from '~/mixins/itemHelper';

interface TwoColsInfoColumn {
  lCols: number;
  lSm: number;
  rCols: number;
  rSm: number;
  lClass: { [key: string]: boolean };
}

export default Vue.extend({
  mixins: [imageHelper, formsHelper, itemHelper],
  async asyncData({ params, $api, $auth }) {
    const item = (
      await $api.userLibrary.getItem({
        userId: $auth.user?.Id,
        itemId: params.itemId
      })
    ).data;

    return {
      item
    };
  },
  data() {
    return {
      item: {} as BaseItemDto
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

<style lang="scss" scoped>
.flex-0 {
  flex: 0;
}
</style>
