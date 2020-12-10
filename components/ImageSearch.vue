<template>
  <v-dialog
    :value="dialog"
    max-width="75%"
    @click:outside="$emit('update:dialog', false)"
  >
    <div class="image-search">
      <v-card class="grey darken-4 px-4" min-height="600">
        <v-card-title>{{ $t('search') }}</v-card-title>
        <v-row>
          <v-col cols="3" offset="1">
            <v-select
              v-model="source"
              :items="sources"
              :disabled="loading"
              label="Source"
              outlined
            ></v-select>
          </v-col>
          <v-col cols="3">
            <v-select
              v-model="type"
              :items="types"
              :disabled="loading"
              label="Type"
              outlined
            ></v-select>
          </v-col>
          <!-- TODO: pagination -->
          <!-- <v-col cols="2" class="d-flex mb-8">
          <div class="body-2 d-flex align-center">pagination</div>
        </v-col> -->
          <v-col cols="4">
            <v-checkbox
              v-model="allLanguage"
              label="All Language"
              value="true"
              :disabled="loading"
              hide-details
            ></v-checkbox>
          </v-col>
        </v-row>
        <v-row>
          <div class="pl-4 img-container" style="width: 100%">
            <v-card v-for="(item, i) in images" :key="i" class="img-card">
              <v-img
                :src="imageFormat(item.Url)"
                :aspect-ratio="ratio"
                position="top center"
                contain
              ></v-img>
              <div class="text-center subtitle-1 mt-2">
                {{ item.ProviderName }}
              </div>
              <div
                class="text-center body-2 grey--text text--darken-2 info-box"
              >
                <template v-if="item.Width && item.Height">
                  {{ item.Width }} &times; {{ item.Height }}
                  <template v-if="item.Language">
                    &middot; {{ item.Language }}
                  </template>
                </template>
              </div>
              <div
                class="text-center body-2 grey--text text--darken-2 info-box"
              >
                <template v-if="item.CommunityRating">
                  {{ item.CommunityRating | fixed }}
                  <template v-if="item.VoteCount">
                    &middot; {{ item.VoteCount }} votes
                  </template>
                </template>
              </div>
              <v-card-actions class="justify-center">
                <v-btn icon :disabled="loading" @click="handleDownload(item)">
                  <v-icon>mdi-cloud-download</v-icon>
                </v-btn>
              </v-card-actions>
            </v-card>
          </div>
        </v-row>
      </v-card>
      <v-progress-circular
        v-if="loading"
        :size="70"
        :width="7"
        color="primary"
        indeterminate
        class="loading-bar"
      ></v-progress-circular>
    </div>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import {
  ImageProviderInfo,
  RemoteImageInfo,
  ImageType
} from '@jellyfin/client-axios';

export default Vue.extend({
  filters: {
    fixed(val: number) {
      if (!val) return val;
      return val.toFixed(1);
    }
  },
  props: {
    metadata: {
      type: Object,
      default: () => ({})
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
      allLanguage: [],
      types: [
        {
          value: ImageType.Primary,
          text: this.$t('primary')
        },
        {
          value: ImageType.Art,
          text: this.$t('art')
        },
        {
          value: ImageType.Backdrop,
          text: this.$t('backdrop')
        },
        {
          value: ImageType.Banner,
          text: this.$t('banner')
        },
        {
          value: ImageType.Box,
          text: this.$t('box')
        },
        {
          value: ImageType.BoxRear,
          text: this.$t('boxRear')
        },
        {
          value: ImageType.Disc,
          text: this.$t('disc')
        },
        {
          value: ImageType.Logo,
          text: this.$t('logo')
        },
        {
          value: ImageType.Menu,
          text: this.$t('menu')
        },
        {
          value: ImageType.Screenshot,
          text: this.$t('screenshot')
        },
        {
          value: ImageType.Thumb,
          text: this.$t('thumb')
        }
      ],
      images: [] as RemoteImageInfo[],
      loading: true
    };
  },
  computed: {
    sources: {
      get(): string[] {
        return ['All'].concat(
          this.$data.providers
            .filter((provider: ImageProviderInfo) =>
              (provider.SupportedImages || []).some((type) => {
                return this.type === type;
              })
            )
            .map((provider: ImageProviderInfo) => provider.Name)
        );
      }
    },
    ratio(): string {
      return this.type === ImageType.Backdrop ? '1.777777778' : '0.666666667';
    }
  },
  watch: {
    type() {
      this.getImages();
    },
    source() {
      this.getImages();
    },
    allLanguage() {
      this.getImages();
    },
    dialog(value) {
      if (value) {
        this.getRemoteImageProviders();
        this.getImages();
      } else {
        this.reset();
      }
    }
  },
  methods: {
    async getRemoteImageProviders() {
      this.providers = (
        await this.$api.remoteImage.getRemoteImageProviders({
          itemId: this.metadata.Id
        })
      ).data;
    },
    async getImages() {
      this.loading = true;
      this.images = (
        await this.$api.remoteImage.getRemoteImages({
          itemId: this.metadata.Id,
          type: this.type,
          limit: 30,
          startIndex: 0,
          includeAllLanguages: this.allLanguage.length > 0
        })
      ).data.Images as RemoteImageInfo[];

      this.loading = false;
    },
    imageFormat(url: string) {
      return `${
        this.$store.state.user.serverUrl
      }/Images/Remote?imageUrl=${encodeURIComponent(url)}`;
    },
    async handleDownload(item: RemoteImageInfo) {
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
    reset() {
      this.providers = [];
      this.type = ImageType.Primary;
      this.source = 'All';
      this.allLanguage = [];
    }
  }
});
</script>
<style scoped>
.image-search {
  position: relative;
}
.loading-bar {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.img-container {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-gap: 20px 20px;
}
.info-box {
  min-height: 20px;
}
</style>
