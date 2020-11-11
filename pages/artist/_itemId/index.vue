<template>
  <v-container>
    <v-row>
      <v-col cols="9">
        <v-row>
          <v-col cols="2">
            <v-img
              class="person-image elevation-2 ml-2"
              cover
              aspect-ratio="1"
              :src="`${$axios.defaults.baseURL}/Items/${item.Id}/Images/Primary`"
            />
          </v-col>
          <v-col cols="7">
            <div
              class="text-subtitle-1 text--secondary font-weight-medium text-capitalize"
            >
              {{ $t('artist') }}
            </div>
            <h1 class="text-h2 font-weight-light">{{ item.Name }}</h1>
            <v-col cols="9" class="pl-0 pr-0">
              <p class="item-overview" v-html="overview" />
            </v-col>
          </v-col>
          <v-col cols="3">
            <v-row v-if="birthDate">
              <v-col cols="3" class="text--secondary">Birth</v-col>
              <v-col cols="9">
                {{ birthDate }}
              </v-col>
            </v-row>
            <v-row v-if="deathDate">
              <v-col cols="3" class="text--secondary">Death</v-col>
              <v-col cols="9">
                {{ deathDate }}
              </v-col>
            </v-row>
            <v-row v-if="birthPlace">
              <v-col cols="3" class="text--secondary">Birthplace</v-col>
              <v-col cols="9">
                {{ birthPlace }}
              </v-col>
            </v-row>
            <v-row v-if="ProductionLocations && ProductionLocations.length > 0">
              <v-col cols="3" class="text--secondary">Birth place</v-col>
              <v-col cols="9">
                {{ item.ProductionLocations[0] }}
              </v-col>
            </v-row>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <h1 class="text-h5 mb-2 ml-2 header">
              <span>{{ $t('albums') }}</span>
            </h1>
            <v-row v-for="appearance in appearances" :key="appearance.Id">
              <v-container>
                <v-row>
                  <v-col cols="1">
                    <card :item="appearance" no-text no-margin />
                  </v-col>
                  <v-col>
                    <div
                      class="text-subtitle-1 text--secondary font-weight-medium text-capitalize"
                    >
                      {{ appearance.ProductionYear }}
                    </div>
                    <nuxt-link
                      class="link"
                      tag="h2"
                      :to="`/item/${appearance.Id}/`"
                      >{{ appearance.Name }}</nuxt-link
                    >
                  </v-col>
                </v-row>
                <v-row>
                  <v-col>
                    <track-list
                      v-if="appearance.Type === 'MusicAlbum'"
                      :item="appearance"
                    ></track-list>
                  </v-col>
                </v-row>
              </v-container>
            </v-row>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="3">
        <related-items :item="item" vertical />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';
import { BaseItemDto } from '~/api';
import htmlHelper from '~/mixins/htmlHelper';
import imageHelper from '~/mixins/imageHelper';
import timeUtils from '~/mixins/timeUtils';

export default Vue.extend({
  mixins: [htmlHelper, imageHelper, timeUtils],
  data() {
    return {
      item: {} as BaseItemDto,
      appearances: [] as BaseItemDto[]
    };
  },
  computed: {
    overview() {
      if (this.$data.item.Overview) {
        return this.sanitizeHtml(this.$data.item.Overview);
      } else {
        return '';
      }
    }
  },
  async beforeMount() {
    const item = (
      await this.$api.userLibrary.getItem({
        userId: this.$auth.user.Id,
        itemId: this.$route.params.itemId
      })
    ).data;

    if (item) {
      this.setBackdrop({ item });
      this.item = item;
    }

    const appearances = (
      await this.$api.items.getItems({
        uId: this.$auth.user.Id,
        userId: this.$auth.user.Id,
        parentId: this.$route.params.itemId
      })
    ).data.Items;

    if (appearances) {
      this.appearances = appearances;
    }
  },
  destroyed() {
    this.clearBackdrop();
  },
  methods: {
    ...mapActions('backdrop', ['setBackdrop', 'clearBackdrop'])
  }
});
</script>

<style lang="scss" scoped>
.person-image {
  border-radius: 50%;
}
.header span {
  padding-left: 0.25em;
}
.header::before {
  background-color: white;
  content: '';
  position: relative;
  display: inline-block;
  height: 1px;
  bottom: 0.3em;
  left: 0;
  width: 1.25em;
}
.link {
  cursor: pointer;
}
.link:hover {
  text-decoration: underline;
}
</style>
