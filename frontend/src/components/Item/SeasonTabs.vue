<template>
  <div>
    <VTabs
      v-model="currentTab"
      class="mb-3"
      bg-color="transparent">
      <VTab
        v-for="season in seasons"
        :key="season.Id">
        {{ season.Name }}
      </VTab>
    </VTabs>
    <VWindow
      v-model="currentTab"
      class="bg-transparent">
      <VWindowItem
        v-for="season in seasons"
        :key="season.Id">
        <VList
          v-if="seasonEpisodes && season.Id"
          :lines="false"
          bg-color="transparent">
          <VListItem
            v-for="episode in seasonEpisodes[season.Id]"
            :key="episode.Id"
            :to="getItemDetailsLink(episode)">
            <VRow
              align="center"
              class="my-4">
              <VCol
                :class="{ 'py-1': $vuetify.display.smAndDown }"
                cols="12"
                md="4">
                <ItemCard
                  :class="{ 'mx-8 mt-8': $vuetify.display.smAndDown }"
                  :item="episode" />
              </VCol>
              <VCol
                :class="{ 'py-1': $vuetify.display.smAndDown }"
                cols="12"
                md="8">
                <VListItemTitle class="text-wrap">
                  {{ episode.IndexNumber }}. {{ episode.Name }}
                </VListItemTitle>
                <VListItemSubtitle class="text-wrap">
                  {{ episode.Overview }}
                </VListItemSubtitle>
              </VCol>
            </VRow>
          </VListItem>
        </VList>
      </VWindowItem>
    </VWindow>
  </div>
</template>

<script setup lang="ts">
import { type BaseItemDto, ItemFields } from '@jellyfin/sdk/lib/generated-client';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/tv-shows-api';
import { ref, shallowRef, watch } from 'vue';
import { getItemDetailsLink } from '@/utils/items';
import { remote } from '@/plugins/remote';

interface TvShowItem {
  /**
   * Seasons: Stores an array of all seasons
   */
  seasons: BaseItemDto[];
  /**
   * SeasonEpisodes: Stores an array for each season containing all the season episodes
   */
  seasonEpisodes: Record<string, BaseItemDto[]>;
}

const { item } = defineProps<{ item: BaseItemDto }>();
const currentTab = shallowRef(0);
const seasons = ref<BaseItemDto[] | null | undefined>([]);
const seasonEpisodes = ref<TvShowItem['seasonEpisodes']>({});

/**
 * Fetch component data
 */
async function fetch(): Promise<void> {
  if (!item.Id) {
    return;
  }

  seasons.value = (
    await remote.sdk.newUserApi(getTvShowsApi).getSeasons({
      userId: remote.auth.currentUserId,
      seriesId: item.Id
    })
  ).data.Items;

  if (seasons.value) {
    for (const season of seasons.value) {
      if (season.Id) {
        const episodes = (
          await remote.sdk.newUserApi(getItemsApi).getItems({
            userId: remote.auth.currentUserId,
            parentId: season.Id,
            fields: [ItemFields.Overview, ItemFields.PrimaryImageAspectRatio]
          })
        ).data;

        if (episodes.Items) {
          seasonEpisodes.value[season.Id] = episodes.Items;
        }
      }
    }
  }
}

await fetch();
watch(() => item, async () => {
  await fetch();
});
</script>
