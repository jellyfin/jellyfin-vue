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
            :class="{ 'text-center': !$vuetify.display.mdAndUp }">
            {{ item.Name }}
          </h1>
          <h2
            v-if="item.AlbumArtist"
            class="text-subtitle-1 text-truncate mt-2"
            :class="{ 'text-center': !$vuetify.display.mdAndUp }">
            <router-link
              class="link"
              :to="getItemDetailsLink(item.AlbumArtists[0], 'MusicArtist')">
              {{ $t('byArtist', { artist: item.AlbumArtist }) }}
            </router-link>
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
            <play-button :item="item" />
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
                      nuxt
                      :to="`/genre/${genre.Id}?type=${item.Type}`">
                      {{ genre.Name }}
                    </v-chip>
                  </v-slide-group-item>
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
import { defineComponent } from 'vue';
import { useRoute } from 'vue-router';
import { BaseItemDto, ImageType } from '@jellyfin/sdk/lib/generated-client';
import { getBlurhash } from '~/utils/images';
import { getItemDetailsLink } from '~/utils/items';

export default defineComponent({
  async setup() {
    const { params } = useRoute();
    const itemId = params.itemId;
    const item = (
      await $api.userLibrary.getItem({
        userId: this.$remote.auth.currentUserId.value,
        itemId
      })
    ).data;

    return { item };
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
  methods: {
    getItemDetailsLink
  }
});
</script>
