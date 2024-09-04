<template>
  <VRow
    v-for="release in releases"
    :key="release.Id"
    no-gutters
    class="my-6">
    <VCol cols="12">
      <div class="d-flex flex-column">
        <VRow>
          <VCol
            lg="2"
            sm="1">
            <ItemCard
              :item="release"
              overlay />
          </VCol>
          <VCol class="py-2">
            <div class="text-subtitle-1 text--secondary font-weight-medium">
              {{ release.ProductionYear }}
            </div>
            <RouterLink
              v-slot="{ navigate }"
              :to="getItemDetailsLink(release)"
              custom>
              <h2
                class="link text-h6 font-weight-bold text-md-h4"
                @click="navigate">
                {{ release.Name }}
              </h2>
            </RouterLink>
          </VCol>
        </VRow>
        <VRow
          v-if="$vuetify.display.mdAndUp"
          class="my-2">
          <VCol>
            <TrackList :item="release" />
          </VCol>
        </VRow>
      </div>
    </VCol>
  </VRow>
</template>

<script setup lang="ts">
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { getItemDetailsLink } from '@/utils/items';

const { releases } = defineProps<{
  releases: BaseItemDto[];
}>();
</script>
