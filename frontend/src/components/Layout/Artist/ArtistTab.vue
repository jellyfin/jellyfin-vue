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
                <nuxt-link
                  class="link font-weight-bold text-h6 text-md-h4"
                  tag="h2"
                  :to="getItemDetailsLink(release)"
                >
                  {{ release.Name }}
                </nuxt-link>
              </v-col>
            </v-row>
            <v-row v-if="$vuetify.breakpoint.mdAndUp" class="my-2">
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

<script lang="ts">
import Vue from 'vue';
import { BaseItemDto } from '@jellyfin/client-axios';
import { getItemDetailsLink } from '~/utils/items';

export default Vue.extend({
  props: {
    releases: {
      type: Array,
      required: true,
      default: (): BaseItemDto[] => {
        return [];
      }
    }
  },
  methods: {
    getItemDetailsLink
  }
});
</script>
