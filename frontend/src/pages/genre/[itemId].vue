<template>
  <div>
    <VAppBar
      flat
      density="compact"
      :class="useResponsiveClasses('second-toolbar')">
      <span class="text-h6 hidden-sm-and-down">
        {{ genre.Name }}
      </span>
      <VSpacer />
      <PlayButton
        :item="genre" />
      <VBtn
        class="play-button mr-2"
        min-width="8em"
        variant="outlined"
        :to="`./${genre.Id}/shuffle`">
        {{ $t('shuffleAll') }}
      </VBtn>
    </VAppBar>
    <VContainer class="after-second-toolbar">
      <ItemGrid
        v-if="genres.length"
        :items="genres" />
      <VRow
        justify="center">
        <VCol
          cols="12"
          :class="
            useResponsiveClasses('card-grid-container empty-card-container')
          ">
          <SkeletonCard
            v-for="n in 24"
            :key="n"
            boilerplate
            text />
        </VCol>
        <div class="empty-message text-center">
          <h1 class="text-h5">
            {{ $t('libraryEmpty') }}
          </h1>
        </div>
      </VRow>
    </VContainer>
  </div>
</template>

<script setup lang="ts">
import {
  SortOrder,
  type BaseItemKind
} from '@jellyfin/sdk/lib/generated-client';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { computed } from 'vue';
import { useRoute } from 'vue-router/auto';
import { isStr } from '@/utils/validation';
import { useResponsiveClasses } from '@/composables/use-responsive-classes';
import { useBaseItem } from '@/composables/apis';

const route = useRoute('/genre/[itemId]');

const { itemId } = route.params;

const includeItemTypes = computed<BaseItemKind[]>(() => {
  const typesQuery = route.query.type as BaseItemKind ?? [];

  return isStr(typesQuery)
    ? [typesQuery]
    : typesQuery;
});

const { data: genre } = await useBaseItem(getUserLibraryApi, 'getItem')(() => ({
  itemId
}));

const { data: genres } = await useBaseItem(getItemsApi, 'getItems')(() => ({
  genreIds: [itemId],
  includeItemTypes: includeItemTypes.value,
  recursive: true,
  sortBy: ['SortName'],
  sortOrder: [SortOrder.Ascending]
}));

route.meta.title = genre.value.Name;
</script>

<style scoped>
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
