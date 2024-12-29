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
            v-for="episode in seasonEpisodes.get(season.Id)"
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
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { shallowRef } from 'vue';
import { getItemDetailsLink } from '#/utils/items';

interface Props {
  /**
   * Seasons: Stores an array of all seasons
   */
  seasons: BaseItemDto[];
  /**
   * SeasonEpisodes: Stores an array for each season containing all the season episodes
   */
  seasonEpisodes: Map<BaseItemDto['Id'], BaseItemDto[]>;
}

const { seasons, seasonEpisodes } = defineProps<Props>();
const currentTab = shallowRef(0);
</script>
