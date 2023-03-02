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
            <play-button class="mr-2" :item="item" />
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
                      size="small"
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
              <v-col :cols="12" :sm="10">
                <v-row dense>
                  <v-col
                    v-for="director in directors"
                    :key="director.Id"
                    cols="auto">
                    <v-chip
                      size="small"
                      link
                      :to="getItemDetailsLink(director, 'Person')">
                      {{ director.Name }}
                    </v-chip>
                  </v-col>
                </v-row>
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
              <v-col :cols="12" :sm="10">
                <v-row dense>
                  <v-col v-for="writer in writers" :key="writer.Id" cols="auto">
                    <v-chip
                      size="small"
                      link
                      :to="getItemDetailsLink(writer, 'Person')">
                      {{ writer.Name }}
                    </v-chip>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
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
        <v-col cols="12">
          <season-tabs v-if="item.Type === 'Series'" :item="item" />
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
      <related-items :item="item" vertical />
    </template>
  </item-cols>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  BaseItemDto,
  BaseItemPerson,
  ImageType
} from '@jellyfin/sdk/lib/generated-client';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { getBlurhash } from '@/utils/images';
import { getItemDetailsLink } from '@/utils/items';
import { useRemote } from '@/composables';

const route = useRoute();
const remote = useRemote();

const item = ref<BaseItemDto>({});

const crew = computed<BaseItemPerson[]>(() =>
  (item.value.People ?? []).filter((person) =>
    ['Director', 'Writer'].includes(person?.Type ?? '')
  )
);

const actors = computed<BaseItemPerson[]>(() =>
  (item.value.People ?? [])
    .filter((person) => person.Type === 'Actor')
    .slice(0, 10)
);

const directors = computed(() =>
  crew.value.filter((person) => person.Type === 'Director')
);

const writers = computed(() =>
  crew.value.filter((person) => person.Type === 'Writer')
);

watch(
  () => (route.params as { itemId: string }).itemId,
  async (itemId) => {
    item.value = (
      await remote.sdk.newUserApi(getUserLibraryApi).getItem({
        userId: remote.auth.currentUserId ?? '',
        itemId
      })
    ).data;

    route.meta.title = item.value.Name;
    route.meta.backdrop.blurhash = getBlurhash(item.value, ImageType.Backdrop);
  },
  { immediate: true }
);
</script>
