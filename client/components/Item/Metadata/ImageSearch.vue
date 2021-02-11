<template>
  <v-dialog
    :value="dialog"
    :fullscreen="$vuetify.breakpoint.mobile"
    content-class="image-search-dialog-content"
    width="60%"
    @click:outside="$emit('update:dialog', false)"
  >
    <v-card height="100%" class="image-search-card">
      <v-card-title>{{ $t('search.name') }}</v-card-title>
      <v-divider />
      <v-row align="center" class="mx-16 my-4">
        <v-select
          v-model="source"
          class="mx-4"
          :items="sources"
          :disabled="loading"
          :label="$t('metadata.source')"
          outlined
          hide-details
        />
        <v-select
          v-model="type"
          class="mx-4"
          :items="types"
          :disabled="loading"
          :label="$t('metadata.type')"
          outlined
          hide-details
        />
        <v-checkbox
          v-model="allLanguages"
          class="mt-0 mx-4"
          :label="$t('allLanguages')"
          :disabled="loading"
          hide-details
        />
      </v-row>
      <v-divider />
      <v-row class="image-results">
        <v-progress-circular
          v-if="loading"
          :size="70"
          :width="7"
          color="primary"
          indeterminate
          class="loading-bar"
        />
        <v-card v-else-if="!images.length" class="mx-auto">
          <v-card-title>
            {{ $t('noImagesFound') }}
          </v-card-title>
        </v-card>
        <v-col v-else class="card-grid-container">
          <v-card
            v-for="(item, i) in images"
            :key="`${item.Type}-${i}`"
            class="ma-2 d-flex flex-column"
          >
            <v-img
              :src="imageFormat(item.Url)"
              :aspect-ratio="ratio"
              position="top center"
              contain
            />
            <div class="text-center text-truncate subtitle-1 mt-2">
              {{ item.ProviderName }}
            </div>
            <div class="text-center body-2 grey--text text--darken-2 info-box">
              <template v-if="item.Width && item.Height">
                {{ item.Width }} &times; {{ item.Height }}
                <template v-if="item.Language">
                  &middot; {{ item.Language }}
                </template>
              </template>
            </div>
            <div class="text-center body-2 grey--text text--darken-2 info-box">
              <template v-if="item.CommunityRating">
                {{ item.CommunityRating | fixed }}
                <template v-if="item.VoteCount">
                  &middot; {{ item.VoteCount }} votes
                </template>
              </template>
            </div>
            <v-spacer />
            <v-card-actions class="justify-center">
              <v-btn icon :disabled="loading" @click="handleDownload(item)">
                <v-icon>mdi-cloud-download</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import {
  ImageProviderInfo,
  RemoteImageInfo,
  ImageType,
  BaseItemDto
} from '@jellyfin/client-axios';

export default Vue.extend({
  filters: {
    fixed(val: number): string | number {
      if (!val) {
        return val;
      }

      return val.toFixed(1);
    }
  },
  props: {
    metadata: {
      type: Object,
      default: (): BaseItemDto => ({})
    },
    dialog: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      providers: [] as ImageProviderInfo[],
      type: ImageType.Primary,
      source: 'All',
      allLanguages: false,
      types: [
        {
          value: ImageType.Primary,
          text: this.$t('imageType.primary')
        },
        {
          value: ImageType.Art,
          text: this.$t('imageType.art')
        },
        {
          value: ImageType.Backdrop,
          text: this.$t('imageType.backdrop')
        },
        {
          value: ImageType.Banner,
          text: this.$t('imageType.banner')
        },
        {
          value: ImageType.Box,
          text: this.$t('imageType.box')
        },
        {
          value: ImageType.BoxRear,
          text: this.$t('imageType.boxRear')
        },
        {
          value: ImageType.Disc,
          text: this.$t('imageType.disc')
        },
        {
          value: ImageType.Logo,
          text: this.$t('imageType.logo')
        },
        {
          value: ImageType.Menu,
          text: this.$t('imageType.menu')
        },
        {
          value: ImageType.Screenshot,
          text: this.$t('imageType.screenshot')
        },
        {
          value: ImageType.Thumb,
          text: this.$t('imageType.thumb')
        }
      ],
      images: [] as RemoteImageInfo[],
      loading: true
    };
  },
  computed: {
    sources: {
      get(): string[] {
        const validProviders = this.providers.filter(
          (provider: ImageProviderInfo) => {
            if (
              provider.Name &&
              provider.SupportedImages?.includes(this.type)
            ) {
              return true;
            }

            return false;
          }
        );
        const providerNames = validProviders.map(
          (provider: ImageProviderInfo) => {
            return provider.Name as string;
          }
        );

        return [this.$t('metadata.sourceAll')].concat(providerNames);
      }
    },
    ratio(): string {
      return this.type === ImageType.Backdrop ? '1.777777778' : '0.666666667';
    }
  },
  watch: {
    type(): void {
      this.getImages();
    },
    source(): void {
      this.getImages();
    },
    allLanguages(): void {
      this.getImages();
    },
    dialog(value): void {
      if (value) {
        this.getRemoteImageProviders();
        this.getImages();
      } else {
        this.reset();
      }
    }
  },
  methods: {
    async getRemoteImageProviders(): Promise<void> {
      this.providers = (
        await this.$api.remoteImage.getRemoteImageProviders({
          itemId: this.metadata.Id
        })
      ).data;
    },
    async getImages(): Promise<void> {
      this.loading = true;
      this.images = (
        await this.$api.remoteImage.getRemoteImages({
          itemId: this.metadata.Id,
          type: this.type,
          providerName: this.source === 'All' ? undefined : this.source,
          includeAllLanguages: this.allLanguages
        })
      ).data.Images as RemoteImageInfo[];

      this.loading = false;
    },
    imageFormat(url: string): string {
      return `${
        this.$axios.defaults.baseURL
      }/Images/Remote?imageUrl=${encodeURIComponent(url)}`;
    },
    async handleDownload(item: RemoteImageInfo): Promise<void> {
      this.loading = true;
      await this.$api.remoteImage.downloadRemoteImage({
        type: item.Type as ImageType,
        imageUrl: item.Url as string,
        itemId: this.metadata.Id
      });
      this.loading = false;
      this.$emit('update:dialog', false);
      this.$emit('download-success', false);
    },
    reset(): void {
      this.providers = [];
      this.type = ImageType.Primary;
      this.source = 'All';
      this.allLanguages = false;
    }
  }
});
</script>

<style lang="scss" scoped>
@import '~vuetify/src/styles/styles.sass';
.loading-bar {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.card-grid-container {
  display: grid;
}

.image-results {
  height: 50vh;
  overflow-y: scroll;
}

@media #{map-get($display-breakpoints, 'sm-and-down')} {
  .card-grid-container {
    grid-template-columns: repeat(3, minmax(calc(100% / 3), 1fr));
  }
}

@media #{map-get($display-breakpoints, 'sm-and-up')} {
  .card-grid-container {
    grid-template-columns: repeat(4, minmax(calc(100% / 4), 1fr));
  }
}

@media #{map-get($display-breakpoints, 'lg-and-up')} {
  .card-grid-container {
    grid-template-columns: repeat(6, minmax(calc(100% / 6), 1fr));
  }
}

@media #{map-get($display-breakpoints, 'xl-only')} {
  .card-grid-container {
    grid-template-columns: repeat(8, minmax(calc(100% / 8), 1fr));
  }
}
</style>
