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
      <VFadeTransition>
        <PlayButton
          v-if="!loading"
          :item="genre" />
      </VFadeTransition>
      <VBtn
        v-if="!loading"
        class="play-button mr-2"
        min-width="8em"
        variant="outlined"
        :to="`./${genre.Id}/shuffle`">
        {{ $t('playback.shuffleAll') }}
      </VBtn>
    </VAppBar>
    <VContainer class="after-second-toolbar">
      <VRow v-if="loading">
        <VCol
          cols="12"
          :class="useResponsiveClasses('card-grid-container')">
          <SkeletonCard
            v-for="n in 24"
            :key="n"
            text />
        </VCol>
      </VRow>
      <ItemGrid
        v-if="genres.length > 0"
        :items="genres"
        :loading="loading" />
      <VRow
        v-else-if="!loading"
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
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router/auto';
import {
  SortOrder,
  ItemFields,
  BaseItemKind,
  BaseItemDto
} from '@jellyfin/sdk/lib/generated-client';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { itemsStore } from '@/store';
import { useRemote, useResponsiveClasses } from '@/composables';

const items = itemsStore();
const route = useRoute();
const remote = useRemote();

const loading = ref(false);
const genre = ref<BaseItemDto>({});
const genres = ref<BaseItemDto[]>([]);

onMounted(async () => {
  const { itemId } = route.params as { itemId: string };
  const typesQuery = route.query.type as BaseItemKind ?? [];

  const includeItemTypes: BaseItemKind[] = typeof typesQuery === 'string'
    ? [typesQuery]
    : typesQuery;

  loading.value = true;

  try {
    genre.value = (
      await remote.sdk.newUserApi(getUserLibraryApi).getItem({
        userId: remote.auth.currentUserId ?? '',
        itemId
      })
    ).data;

    route.meta.title = genre.value.Name;

    genres.value =
      (
        await remote.sdk.newUserApi(getItemsApi).getItems({
          genreIds: [itemId],
          includeItemTypes: includeItemTypes,
          recursive: true,
          sortBy: ['SortName'],
          sortOrder: [SortOrder.Ascending],
          fields: Object.values(ItemFields),
          userId: remote.auth.currentUserId ?? ''
        })
      ).data.Items ?? [];

    genres.value = items.addCollection(genre.value, genres.value);
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
});
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
