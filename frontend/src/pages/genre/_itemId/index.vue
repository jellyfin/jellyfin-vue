<template>
  <div>
    <v-app-bar fixed flat dense :class="useResponsiveClasses('second-toolbar')">
      <span class="text-h6 hidden-sm-and-down">
        {{ genre.Name }}
      </span>
      <v-spacer />
      <v-fade-transition>
        <play-button v-if="!$fetchState.pending" :item="genre" />
      </v-fade-transition>
      <v-btn
        v-if="!$fetchState.pending"
        class="play-button mr-2"
        min-width="8em"
        variant="outlined"
        rounded
        :to="`./${genre.Id}/shuffle`">
        {{ $t('playback.shuffleAll') }}
      </v-btn>
    </v-app-bar>
    <v-container class="after-second-toolbar">
      <v-row v-if="$fetchState.pending">
        <v-col cols="12" :class="useResponsiveClasses('card-grid-container')">
          <skeleton-card v-for="n in 24" :key="n" text />
        </v-col>
      </v-row>
      <item-grid
        v-if="genres.length > 0"
        :items="genres"
        :loading="$fetchState.pending" />
      <v-row v-else-if="!$fetchState.pending" justify="center">
        <v-col
          cols="12"
          :class="
            useResponsiveClasses('card-grid-container empty-card-container')
          ">
          <skeleton-card v-for="n in 24" :key="n" boilerplate text />
        </v-col>
        <div class="empty-message text-center">
          <h1 class="text-h5">
            {{ $t('libraryEmpty') }}
          </h1>
        </div>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { SortOrder, ItemFields } from '@jellyfin/sdk/lib/generated-client';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { itemsStore } from '~/store';
import { useRemote, useResponsiveClasses } from '@/composables';

const items = itemsStore();
const route = useRoute();
const remote = useRemote();

const itemId = route.params.itemId;
const item = (
  await remote.sdk.newUserApi(getUserLibraryApi).getItem({
    userId: remote.auth.currentUserId.value || '',
    itemId
  })
).data;

let genres = (
  await remote.sdk.newUserApi(getItemsApi).getItems({
    genreIds: [item.Id as string],
    includeItemTypes: [route.query.type.toString()],
    recursive: true,
    sortBy: ['SortName'],
    sortOrder: [SortOrder.Ascending],
    fields: Object.values(ItemFields),
    userId: remote.auth.currentUserId.value || ''
  })
).data.Items;

genres = items.addCollection(item, genres || []);

route.meta.title = item.Name;
</script>

<style lang="scss" scoped>
.second-toolbar {
  top: 56px;
}

.second-toolbar.md-and-up {
  top: 64px;
}

.second-toolbar.lg-and-up {
  left: 256px !important;
}

.after-second-toolbar {
  padding-top: 60px;
}

.genre-toolbar {
  width: 100%;
}

.scroller {
  max-height: 100%;
}

.card-grid-container {
  display: grid;
}

.card-grid-container.sm-and-down {
  grid-template-columns: repeat(3, minmax(calc(100% / 3), 1fr));
}

.card-grid-container.sm-and-up {
  grid-template-columns: repeat(4, minmax(calc(100% / 4), 1fr));
}

.card-grid-container.lg-and-up {
  grid-template-columns: repeat(6, minmax(calc(100% / 6), 1fr));
}

.card-grid-container.xl {
  grid-template-columns: repeat(8, minmax(calc(100% / 8), 1fr));
}
</style>
