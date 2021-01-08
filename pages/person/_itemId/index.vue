<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-row>
          <v-col cols="2">
            <v-img
              v-if="item.Id"
              ref="personImg"
              class="person-image elevation-2 ml-2"
              cover
              aspect-ratio="1"
              :src="getImageUrl(item.Id)"
            />
          </v-col>
          <v-col cols="7">
            <div
              class="text-subtitle-1 text--secondary font-weight-medium text-capitalize"
            >
              {{ $t('person') }}
            </div>
            <h1 class="text-h2 font-weight-light">{{ item.Name }}</h1>
            <v-col cols="9" class="pl-0 pr-0">
              <p class="item-overview">{{ item.Overview }}</p>
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
        <v-row v-if="movies.length > 0">
          <v-col>
            <swiper-section
              :title="$t('movies')"
              :items="movies"
              :loading="loading"
            />
          </v-col>
        </v-row>

        <v-row v-if="shows.length > 0">
          <v-col>
            <swiper-section
              :title="$t('shows')"
              :items="shows"
              :loading="loading"
            />
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';
import { BaseItemDto, ImageType } from '@jellyfin/client-axios';
import imageHelper from '~/mixins/imageHelper';
import timeUtils from '~/mixins/timeUtils';

export default Vue.extend({
  mixins: [imageHelper, timeUtils],
  data() {
    return {
      loading: true,
      item: {} as BaseItemDto,
      appearances: [] as BaseItemDto[],
      backdropImageSource: ''
    };
  },
  computed: {
    birthDate(): Date | null {
      if (this.$data.item.PremiereDate) {
        return new Date(this.$data.item.PremiereDate);
      } else {
        return null;
      }
    },
    deathDate: {
      get(): Date | null {
        if (this.$data.item.EndDate) {
          return new Date(this.$data.item.EndDate);
        } else {
          return null;
        }
      }
    },
    birthPlace: {
      get(): string | null {
        if (this.$data.item.ProductionLocations) {
          return this.$data.item.ProductionLocations[0];
        } else {
          return null;
        }
      }
    },
    movies: {
      get(): BaseItemDto[] {
        return this.$data.appearances
          .filter((appearance: BaseItemDto) => {
            return appearance.Type === 'Movie';
          })
          .slice(0, 10);
      }
    },
    shows: {
      get(): BaseItemDto[] {
        return this.$data.appearances
          .filter((appearance: BaseItemDto) => {
            return appearance.Type === 'Series';
          })
          .slice(0, 10);
      }
    }
  },
  async beforeMount() {
    this.loading = true;
    const item = (
      await this.$api.userLibrary.getItem({
        userId: this.$auth.user?.Id,
        itemId: this.$route.params.itemId
      })
    ).data;

    if (item) {
      this.setBackdrop({ item });
      this.item = item;
    }

    const appearances = (
      await this.$api.items.getItems({
        userId: this.$auth.user?.Id,
        personIds: [this.$route.params.itemId],
        recursive: true,
        collapseBoxSetItems: false
      })
    ).data.Items;

    if (appearances) {
      this.appearances = appearances;
    }
    this.loading = false;
  },
  destroyed() {
    this.clearBackdrop();
  },
  methods: {
    ...mapActions('backdrop', ['setBackdrop', 'clearBackdrop']),
    getImageUrl(itemId: string | undefined): string {
      const element = this.$refs.personImg as HTMLElement;
      if (itemId) {
        return this.getImageUrlForElement(ImageType.Primary, {
          itemId,
          element
        });
      } else {
        return '';
      }
    }
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
</style>
