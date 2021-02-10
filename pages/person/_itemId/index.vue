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
              {{ $t('item.person.person') }}
            </div>
            <h1 class="text-h2 font-weight-light">{{ item.Name }}</h1>
            <v-col cols="9" class="pl-0 pr-0">
              <p class="item-overview">{{ item.Overview }}</p>
            </v-col>
          </v-col>
          <v-col cols="3">
            <v-row v-if="birthDate">
              <v-col cols="3" class="text--secondary">
                {{ $t('item.person.birth') }}
              </v-col>
              <v-col cols="9">
                {{ birthDate }}
              </v-col>
            </v-row>
            <v-row v-if="deathDate">
              <v-col cols="3" class="text--secondary">
                {{ $t('item.person.death') }}
              </v-col>
              <v-col cols="9">
                {{ deathDate }}
              </v-col>
            </v-row>
            <v-row v-if="birthPlace">
              <v-col cols="3" class="text--secondary">
                {{ $t('item.person.birthplace') }}
              </v-col>
              <v-col cols="9">
                {{ birthPlace }}
              </v-col>
            </v-row>
          </v-col>
        </v-row>
        <v-row v-if="movies.length > 0">
          <v-col>
            <client-only>
              <swiper-section :title="$t('movies')" :items="movies" />
            </client-only>
          </v-col>
        </v-row>

        <v-row v-if="shows.length > 0">
          <v-col>
            <client-only>
              <swiper-section :title="$t('shows')" :items="shows" />
            </client-only>
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
  async asyncData({ params, $api, $auth }) {
    const item = (
      await $api.userLibrary.getItem({
        userId: $auth.user?.Id,
        itemId: params.itemId
      })
    ).data;

    const appearances = (
      await $api.items.getItems({
        userId: $auth.user?.Id,
        personIds: [params.itemId],
        recursive: true,
        collapseBoxSetItems: false
      })
    ).data.Items;

    return { item, appearances };
  },
  data() {
    return {
      item: {} as BaseItemDto,
      appearances: [] as BaseItemDto[]
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
  watch: {
    item: {
      handler(val: BaseItemDto): void {
        this.setPageTitle({ title: val.Name });
        const hash = this.getBlurhash(val, ImageType.Backdrop);
        this.setBackdrop({ hash });
      },
      immediate: true,
      deep: true
    }
  },
  created() {
    this.setAppBarOpacity({ opaqueAppBar: false });
  },
  destroyed() {
    this.setAppBarOpacity({ opaqueAppBar: true });
    this.clearBackdrop();
  },
  methods: {
    ...mapActions('page', ['setPageTitle', 'setAppBarOpacity']),
    ...mapActions('backdrop', ['setBackdrop', 'clearBackdrop']),
    getImageUrl(itemId: string | undefined): string | undefined {
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
</style>
