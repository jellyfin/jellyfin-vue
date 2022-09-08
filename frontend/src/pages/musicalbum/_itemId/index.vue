<template>
  <item-cols>
    <template #left>
      <v-row justify="center" justify-md="start">
        <v-col cols="7" md="3">
          <card :item="item" />
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
            <nuxt-link
              class="link"
              :to="getItemDetailsLink(item.AlbumArtists[0], 'MusicArtist')"
            >
              {{ $t('byArtist', { artist: item.AlbumArtist }) }}
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
              'ml-0': $vuetify.breakpoint.mdAndUp
            }"
          >
            <play-button :item="item" />
            <like-button :item="item" class="mr-2" />
            <mark-played-button :item="item" class="mr-2" />
            <item-menu :item="item" />
          </v-row>
          <v-col cols="12" md="10">
            <v-row
              v-if="item && item.GenreItems && item.GenreItems.length > 0"
              align="center"
            >
              <v-col :cols="12" :sm="2" class="px-0 text-truncate">
                <label class="text--secondary">{{ $t('genres') }}</label>
              </v-col>
              <v-col class="px-0" :cols="12" :sm="10">
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
import { mapStores } from 'pinia';
import { BaseItemDto, ImageType } from '@jellyfin/client-axios';
import { Context } from '@nuxt/types';
import { getBlurhash } from '~/utils/images';
import { getItemDetailsLink, isValidMD5 } from '~/utils/items';
import { authStore, pageStore } from '~/store';

export default Vue.extend({
  meta: {
    backdrop: true,
    transparentLayout: true
  },
  validate(ctx: Context) {
    return isValidMD5(ctx.route.params.itemId);
  },
  async asyncData({ params, $api }) {
    const auth = authStore();

    const itemId = params.itemId;
    const item = (
      await $api.userLibrary.getItem({
        userId: auth.currentUserId,
        itemId
      })
    ).data;

    return { item };
  },
  data() {
    return {
      item: {} as BaseItemDto
    };
  },
  head() {
    return {
      title: this.page.title
    };
  },
  computed: {
    ...mapStores(pageStore)
  },
  watch: {
    item: {
      handler(val: BaseItemDto): void {
        this.page.title = val.Name || '';

        this.page.backdrop.blurhash = getBlurhash(val, ImageType.Backdrop);
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    getItemDetailsLink
  }
});
</script>
