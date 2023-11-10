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
                <Card
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
import { BaseItemDto, ItemFields } from '@jellyfin/sdk/lib/generated-client';
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/tv-shows-api';
import { ref, watch } from 'vue';
import { getItemDetailsLink } from '@/utils/items';
import { useRemote } from '@/composables';

interface TvShowItem {
  /**
   * Seasons: Stores an array of all seasons
   */
  seasons: BaseItemDto[];
  /**
   * SeasonEpisodes: Stores an array for each season containing all the season episodes
   */
  seasonEpisodes: { [key: string]: BaseItemDto[] };
}

const props = defineProps<{ item: BaseItemDto }>();
const remote = useRemote();
const currentTab = ref(0);
const seasons = ref<BaseItemDto[] | null | undefined>([]);
const seasonEpisodes = ref<TvShowItem['seasonEpisodes']>({});

/**
 * Fetch component data
 */
async function fetch(): Promise<void> {
  if (!props.item.Id) {
    return;
  }

  const tvShowApi = remote.sdk.newUserApi(getTvShowsApi);

  seasons.value = (
    await tvShowApi.getSeasons({
      userId: remote.auth.currentUserId,
      seriesId: props.item.Id
    })
  ).data.Items;

  if (seasons.value) {
    const seasonsRequests = seasons.value.filter(s => s.Id)
      .map(s => ({
        SeasonId: s.Id as string,
        EpisodesPromise: tvShowApi.getEpisodes({
          userId: remote.auth.currentUserId,
          seriesId: props.item.Id!,
          seasonId: s.Id,
          fields: [ItemFields.Overview, ItemFields.PrimaryImageAspectRatio]
        })
      }));

    for (const seasonReq of seasonsRequests) {
      seasonEpisodes.value[seasonReq.SeasonId] = (await seasonReq.EpisodesPromise).data.Items as BaseItemDto[];
    }
  }
}

await fetch();
watch(props, async () => {
  await fetch();
});
</script>
