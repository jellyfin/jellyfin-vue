<template>
  <v-row no-gutters>
    <v-col cols="12" class="my-6">
      <v-row v-for="release in releases" :key="release.Id">
        <v-col cols="12">
          <div class="d-flex flex-column">
            <v-row>
              <v-col lg="2" sm="1">
                <card :item="release" overlay link />
              </v-col>
              <v-col class="py-2">
                <div class="text-subtitle-1 text--secondary font-weight-medium">
                  {{ release.ProductionYear }}
                </div>
                <router-link
                  v-slot="{ navigate }"
                  :to="getItemDetailsLink(release)"
                  custom>
                  <h2
                    class="link font-weight-bold text-h6 text-md-h4"
                    @click="navigate">
                    {{ release.Name }}
                  </h2>
                </router-link>
              </v-col>
            </v-row>
            <v-row v-if="$vuetify.display.mdAndUp" class="my-2">
              <v-col>
                <track-list :item="release" />
              </v-col>
            </v-row>
          </div>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { getItemDetailsLink } from '@/utils/items';

defineProps<{
  releases: BaseItemDto[];
}>();
</script>
