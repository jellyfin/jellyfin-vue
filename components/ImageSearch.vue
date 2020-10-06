<template>
  <v-dialog v-model="dialog" max-width="75%">
    <v-card class="image-search grey darken-4 px-4">
      <v-card-title>{{ $t('search') }}</v-card-title>
      <v-row>
        <v-col cols="3">
          <v-select
            v-model="source"
            :items="sources"
            label="Source"
            outlined
          ></v-select>
        </v-col>
        <v-col cols="3">
          <v-select
            v-model="type"
            :items="types"
            label="Type"
            outlined
          ></v-select>
        </v-col>
        <v-col cols="2" class="d-flex mb-8">
          <div class="body-2 d-flex align-center">sdsd</div>
        </v-col>
        <v-col cols="4">
          <v-checkbox
            v-model="allLang"
            label="All Language"
            value="true"
            hide-details
          ></v-checkbox>
        </v-col>
      </v-row>
      <v-row>
        <div class="d-flex flex-wrap">
          <v-card v-for="(item, i) in images" :key="i">
            <v-img :src="imageFormat(item.Url)" max-width="200"></v-img>
          </v-card>
        </div>
      </v-row>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import { ImageProviderInfo } from '~/api';

export default Vue.extend({
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
      type: 'Primary',
      source: 'All',
      allLang: [],
      types: [
        {
          value: 'Primary',
          text: this.$t('primary')
        },
        {
          value: 'Art',
          text: this.$t('art')
        },
        {
          value: 'Backdrop',
          text: this.$t('backdrop')
        },
        {
          value: 'Banner',
          text: this.$t('banner')
        },
        {
          value: 'Box',
          text: this.$t('box')
        },
        {
          value: 'BoxRear',
          text: this.$t('boxRear')
        },
        {
          value: 'Disc',
          text: this.$t('disc')
        },
        {
          value: 'Logo',
          text: this.$t('logo')
        },
        {
          value: 'Menu',
          text: this.$t('menu')
        },
        {
          value: 'Screenshot',
          text: this.$t('screenshot')
        },
        {
          value: 'Thumb',
          text: this.$t('thumb')
        }
      ],
      images: []
    };
  },
  computed: {
    sources: {
      get() {
        return ['All'].concat(
          this.$data.providers
            .filter((provider: ImageProviderInfo) =>
              (provider.SupportedImages || []).some(
                (type) => this.type === type
              )
            )
            .map((provider: ImageProviderInfo) => provider.Name)
        );
      }
    }
  },
  watch: {
    metadata() {
      this.getRemoteImageProviders();
    },
    type() {
      this.getImages();
    }
  },

  created() {
    this.getRemoteImageProviders();
  },
  methods: {
    async getRemoteImageProviders() {
      this.providers = (
        await this.$remoteImageApi.getRemoteImageProviders({
          itemId: this.metadata.Id
        })
      ).data;
    },
    async getImages() {
      this.images = (
        await this.$remoteImageApi.getRemoteImages({
          itemId: this.metadata.Id,
          type: this.type,
          limit: 30,
          startIndex: 0,
          includeAllLanguages: this.allLang.length > 0
        })
      ).data.Images;
    },
    imageFormat(url) {
      return `${
        this.$store.state.user.serverUrl
      }/Images/Remote?imageUrl=${encodeURIComponent(url)}`;
    }
  }
});
</script>
<style scoped>
.image-search {
  height: 600px;
}
</style>
