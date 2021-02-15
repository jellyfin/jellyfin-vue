<template>
  <v-stepper v-model="identifyStage">
    <v-stepper-header>
      <v-stepper-step
        :complete="identifyStage > 1"
        :editable="identifyStage > 1"
        step="1"
      >
        {{ $t('search') }}
      </v-stepper-step>

      <v-divider></v-divider>

      <v-stepper-step
        :complete="identifyStage > 2"
        :editable="identifyStage > 2"
        step="2"
      >
        {{ $t('select') }}
      </v-stepper-step>

      <v-divider></v-divider>

      <v-stepper-step step="3">{{ $t('confirm') }}</v-stepper-step>
    </v-stepper-header>

    <v-stepper-items>
      <v-stepper-content step="1">
        <v-text-field
          v-model="itemName"
          class="mt-3"
          outlined
          :label="$t('name')"
          type="text"
          @keyup.enter="lookupData"
        />
        <v-text-field
          v-model="itemYear"
          class="mt-3"
          outlined
          :label="$t('year')"
          type="number"
          @keyup.enter="lookupData"
        />
        <v-btn
          color="primary"
          :disabled="loading"
          :loading="loading"
          @click="lookupData"
          >{{ $t('search') }}</v-btn
        >
      </v-stepper-content>

      <v-stepper-content step="2">
        <v-card
          v-for="result in searchResults"
          :key="result.ProviderIds.Imdb"
          class="mb-5"
          @click="selectItem(result)"
        >
          <v-img
            v-if="result.ImageUrl"
            :src="getSearchImage(result.ImageUrl, result.SearchProviderName)"
          />
          <v-card-title>{{ result.Name }}</v-card-title>
          <v-card-subtitle>{{ result.SearchProviderName }}</v-card-subtitle>
        </v-card>
        <v-card v-if="!searchResults.length">
          <v-card-title>{{ $t('noItemsFound') }}</v-card-title>
        </v-card>

        <v-btn text @click="exit">{{ $t('cancel') }}</v-btn>
      </v-stepper-content>

      <v-stepper-content step="3">
        <v-card class="mb-5">
          <v-img
            v-if="selectedItem.ImageUrl"
            :src="
              getSearchImage(
                selectedItem.ImageUrl,
                selectedItem.SearchProviderName
              )
            "
          />
          <v-card-title>{{ selectedItem.Name }}</v-card-title>
          <v-card-subtitle>
            {{ selectedItem.SearchProviderName }}
          </v-card-subtitle>
        </v-card>

        <v-checkbox v-model="replaceImages" label="Replace Existing Images" />
        <v-btn
          :disabled="loading"
          :loading="loading"
          color="primary"
          @click="setItem(selectedItem)"
        >
          {{ $t('confirm') }}
        </v-btn>

        <v-btn text @click="exit">{{ $t('cancel') }}</v-btn>
      </v-stepper-content>
    </v-stepper-items>
  </v-stepper>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';
import { BaseItemDto, RemoteSearchResult } from '@jellyfin/client-axios';

export default Vue.extend({
  props: {
    item: {
      type: Object as () => BaseItemDto,
      required: true,
      default: {}
    }
  },
  data() {
    return {
      itemName: '',
      itemYear: undefined,
      searchResults: [] as RemoteSearchResult[],
      replaceImages: true,
      loading: false,
      selectedItem: {} as RemoteSearchResult,
      identifyStage: 1
    };
  },
  methods: {
    ...mapActions('snackbar', ['pushSnackbarMessage']),
    async lookupData() {
      this.loading = true;

      // TODO Add support for searching by IMDB/TVDB/Zap2It

      switch (this.item.Type) {
        case 'Series': {
          const response = await this.$api.itemLookup.getSeriesRemoteSearchResults(
            {
              seriesInfoRemoteSearchQuery: {
                SearchInfo: { Name: this.itemName, Year: this.itemYear },
                ItemId: this.item.Id
              }
            }
          );
          this.searchResults = response.data;
          break;
        }
        case 'Movie': {
          const response = await this.$api.itemLookup.getMovieRemoteSearchResults(
            {
              movieInfoRemoteSearchQuery: {
                SearchInfo: { Name: this.itemName, Year: this.itemYear },
                ItemId: this.item.Id
              }
            }
          );
          this.searchResults = response.data;
          break;
        }
      }

      this.identifyStage = 2;
      this.loading = false;
    },
    selectItem(item: RemoteSearchResult) {
      this.selectedItem = item;
      this.identifyStage = 3;
    },
    async setItem(info: RemoteSearchResult) {
      try {
        this.loading = true;
        const response = await this.$api.itemLookup.applySearchCriteria({
          remoteSearchResult: info,
          itemId: this.item.Id || '',
          replaceAllImages: this.replaceImages
        });

        if (response.status === 204) {
          this.loading = false;
          this.pushSnackbarMessage({
            message: this.$t('itemIdentified'),
            error: 'success'
          });
          this.$emit('identified');
        }
      } catch (error) {
        this.pushSnackbarMessage({
          message: error,
          error: 'error'
        });
      }
    },
    getSearchImage(imageUrl: string, searchProviderName: string) {
      return encodeURI(
        `${this.$axios.defaults.baseURL}/Items/RemoteSearch/Image?imageUrl=${imageUrl}&ProviderName=${searchProviderName}&api_key=${this.$store.state.user.accessToken}`
      );
    },
    exit() {
      this.$emit('identified');
    }
  }
});
</script>

<style lang="scss" scoped>
.identifyItemContainer {
  padding: 0.5em;
}
</style>
