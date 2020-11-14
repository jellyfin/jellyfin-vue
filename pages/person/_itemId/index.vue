<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-row>
          <v-col cols="2">
            <lazy-image
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
            <h1 class="text-h5 mb-2 ml-2 header">
              <span>{{ $t('movies') }}</span>
            </h1>
            <vueper-slides
              :bullets="false"
              :bullets-outside="false"
              :arrows-outside="false"
              :visible-slides="6"
              :slide-multiple="true"
              :breakpoints="breakpoints"
              fixed-height="true"
            >
              <vueper-slide v-for="movie in movies" :key="movie.Id">
                <template v-slot:content>
                  <card :item="movie" />
                </template>
              </vueper-slide>

              <template v-slot:arrow-left>
                <v-btn icon large>
                  <v-icon>mdi-arrow-left</v-icon>
                </v-btn>
              </template>

              <template v-slot:arrow-right>
                <v-btn icon large>
                  <v-icon>mdi-arrow-right</v-icon>
                </v-btn>
              </template>
            </vueper-slides>
          </v-col>
        </v-row>

        <v-row v-if="shows.length > 0">
          <v-col>
            <h1 class="text-h5 mb-2 ml-2 header">
              <span>{{ $t('shows') }}</span>
            </h1>
            <vueper-slides
              :bullets="false"
              :bullets-outside="false"
              :arrows-outside="false"
              :visible-slides="6"
              :slide-multiple="true"
              :breakpoints="breakpoints"
              fixed-height="true"
            >
              <vueper-slide v-for="show in shows" :key="show.Id">
                <template v-slot:content>
                  <card :item="show" />
                </template>
              </vueper-slide>

              <template v-slot:arrow-left>
                <v-btn icon large>
                  <v-icon>mdi-arrow-left</v-icon>
                </v-btn>
              </template>

              <template v-slot:arrow-right>
                <v-btn icon large>
                  <v-icon>mdi-arrow-right</v-icon>
                </v-btn>
              </template>
            </vueper-slides>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';
import { BaseItemDto } from '~/api';
import imageHelper from '~/mixins/imageHelper';
import timeUtils from '~/mixins/timeUtils';

export default Vue.extend({
  mixins: [imageHelper, timeUtils],
  data() {
    return {
      item: {} as BaseItemDto,
      appearances: [] as BaseItemDto[],
      backdropImageSource: '',
      breakpoints: {
        600: {
          visibleSlides: 3
        },
        960: {
          visibleSlides: 4
        },
        1264: {
          visibleSlides: 6
        },
        1904: {
          visibleSlides: 6
        }
      }
    };
  },
  computed: {
    birthDate() {
      if (this.$data.item.PremiereDate) {
        return new Date(this.$data.item.PremiereDate);
      } else {
        return null;
      }
    },
    deathDate: {
      get() {
        if (this.$data.item.EndDate) {
          return new Date(this.$data.item.EndDate);
        } else {
          return null;
        }
      }
    },
    birthPlace: {
      get() {
        if (this.$data.item.ProductionLocations) {
          return this.$data.item.ProductionLocations[0];
        } else {
          return null;
        }
      }
    },
    movies: {
      get() {
        return this.$data.appearances
          .filter((appearance: BaseItemDto) => {
            return appearance.Type === 'Movie';
          })
          .slice(0, 10);
      }
    },
    shows: {
      get() {
        return this.$data.appearances
          .filter((appearance: BaseItemDto) => {
            return appearance.Type === 'Series';
          })
          .slice(0, 10);
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
        personIds: this.$route.params.itemId,
        recursive: true,
        collapseBoxSetItems: false
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
</style>

<style>
.vueperslides__track {
  position: relative;
  cursor: default !important;
}

@media (hover: none) {
  .vueperslides__arrows {
    display: none !important;
  }
}

.vueperslides__arrows {
  display: flex;
  position: absolute;
  top: -2.75em;
  right: 0;
  align-items: center;
}

.vueperslides__arrow {
  position: relative;
  display: inline-flex;
  transform: none;
}

.vueperslides__arrow--prev {
  margin-right: 0.75em;
}
.vueperslides:not(.no-shadow):not(.vueperslides--3d)
  .vueperslides__parallax-wrapper::after,
.vueperslides:not(.no-shadow):not(.vueperslides--3d)
  .vueperslides__parallax-wrapper::before {
  box-shadow: none;
}
</style>
