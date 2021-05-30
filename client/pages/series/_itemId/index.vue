<template>
  <item-cols>
    <template #left>
      <v-row justify="center" justify-md="start">
        <v-col cols="7" md="3">
          <card :item="item" />
        </v-col>
        <v-col cols="12" md="9">
          <h1
            class="text-h4 font-weight-light"
            :class="{ 'text-center': !$vuetify.breakpoint.mdAndUp }"
          >
            {{ item.Name }}
          </h1>
          <h2
            v-if="item.OriginalTitle && item.OriginalTitle !== item.Name"
            class="text-subtitle-1"
            :class="{ 'text-center': !$vuetify.breakpoint.mdAndUp }"
          >
            {{ item.OriginalTitle }}
          </h2>
          <div
            class="text-overline font-weight-medium mt-2"
            :class="{ 'text-center': !$vuetify.breakpoint.mdAndUp }"
          >
            <media-info :item="item" year runtime rating ends-at />
          </div>
          <v-row
            class="my-4 align-center"
            :class="{
              'justify-center': !$vuetify.breakpoint.mdAndUp,
              'ml-0': $vuetify.breakpoint.mdAndUp
            }"
          >
            <play-button class="mr-2" :item="item" />
            <like-button :item="item" class="mr-2" />
            <mark-played-button :item="item" class="mr-2" />
            <item-menu :item="item" />
          </v-row>
          <v-col cols="12" md="10">
            <v-row
              v-if="item && item.GenreItems && item.GenreItems.length > 0"
              align="center"
            >
              <v-col :cols="12" :sm="2" class="px-0 text-truncate">
                <label class="text--secondary">{{ $t('genres') }}</label>
              </v-col>
              <v-col class="px-0" :cols="12" :sm="10">
                <v-slide-group>
                  <v-slide-item
                    v-for="(genre, index) in item.GenreItems"
                    :key="`genre-${genre.Id}`"
                  >
                    <v-chip
                      small
                      link
                      :class="{ 'ml-2': index > 0 }"
                      nuxt
                      :to="`/genre/${genre.Id}?type=${item.Type}`"
                    >
                      {{ genre.Name }}
                    </v-chip>
                  </v-slide-item>
                </v-slide-group>
              </v-col>
            </v-row>
            <v-row v-if="item.Tags.length > 0" align="center">
              <v-col :cols="12" :sm="2" class="px-0 text-truncate">
                <label class="text--secondary">{{ $t('item.tags') }}</label>
              </v-col>
              <v-col class="px-0" :cols="12" :sm="10">
                <v-slide-group>
                  <v-slide-item v-for="(tag, index) in item.Tags" :key="index">
                    <v-chip small :class="{ 'ml-2': index > 0 }">
                      {{ tag }}
                    </v-chip>
                  </v-slide-item>
                </v-slide-group>
              </v-col>
            </v-row>
            <v-row v-if="item && directors.length > 0" align="center">
              <v-col :cols="12" :sm="2" class="px-0 text-truncate">
                <label class="text--secondary">{{ $t('directing') }}</label>
              </v-col>
              <v-col class="px-0" :cols="12" :sm="10">
                <v-slide-group>
                  <v-slide-item
                    v-for="director in directors"
                    :key="director.Id"
                  >
                    <v-chip
                      small
                      link
                      :class="{ 'ml-2': index > 0 }"
                      nuxt
                      :to="getItemDetailsLink(director, 'Person')"
                    >
                      {{ director.Name }}
                    </v-chip>
                  </v-slide-item>
                </v-slide-group>
              </v-col>
            </v-row>
            <v-row v-if="item && writers.length > 0" align="center">
              <v-col
                :cols="12"
                :sm="2"
                class="mt-sm-3 py-sm-0 px-0 text-truncate"
              >
                <label class="text--secondary">{{ $t('writing') }}</label>
              </v-col>
              <v-col :cols="12" :sm="10">
                <v-slide-group>
                  <v-slide-item v-for="writer in writers" :key="writer.Id">
                    <v-chip
                      small
                      link
                      nuxt
                      :to="getItemDetailsLink(writer, 'Person')"
                    >
                      {{ writer.Name }}
                    </v-chip>
                  </v-slide-item>
                </v-slide-group>
              </v-col>
            </v-row>
          </v-col>
          <div>
            <p
              v-if="item.Taglines && item.Taglines.length > 0"
              class="text-subtitle-1 text-truncate"
            >
              {{ item.Taglines[0] }}
            </p>
          </div>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-tabs v-model="activeTab" background-color="transparent">
            <v-tab :key="0">
              {{ $t('item.series.episodes') }}
            </v-tab>
            <v-tab :key="1">
              {{ $t('castAndCrew') }}
            </v-tab>
            <v-tab :key="2">
              {{ $t('item.artist.information') }}
            </v-tab>
          </v-tabs>
          <v-tabs-items v-model="activeTab" class="transparent my-6">
            <v-tab-item :key="0">
              <season-tabs :item="item" />
            </v-tab-item>
            <v-tab-item :key="1"> Lorem </v-tab-item>
            <v-tab-item :key="2">
              <v-container>
                <v-row>
                  <v-col cols="12" md="7">
                    <span
                      class="d-block item-overview"
                      v-text="item.Overview"
                    />
                  </v-col>
                  <v-col cols="12" md="5">
                    <v-row
                      v-if="item.Studios.length > 0 && item.Studios[0].Name"
                      no-gutters
                    >
                      <v-col cols="2" md="5" class="text--secondary">
                        {{ $t('item.series.network') }}
                      </v-col>
                      <v-col cols="9" md="7">
                        {{ item.Studios[0].Name }}
                      </v-col>
                    </v-row>
                    <v-row v-if="startDate" no-gutters>
                      <v-col cols="2" md="5" class="text--secondary">
                        {{ $t('item.series.started') }}
                      </v-col>
                      <v-col cols="9" md="7">
                        {{ startDate }}
                      </v-col>
                    </v-row>
                    <v-row v-if="endDate" no-gutters>
                      <v-col cols="2" md="5" class="text--secondary">
                        {{ $t('item.series.ended') }}
                      </v-col>
                      <v-col cols="9" md="7">
                        {{ endDate }}
                      </v-col>
                    </v-row>
                    <v-row v-if="item.RunTimeTicks" no-gutters>
                      <v-col cols="2" md="5" class="text--secondary">
                        {{ $t('item.duration') }}
                      </v-col>
                      <v-col cols="9" md="7">
                        {{ getRuntimeTime(item.RunTimeTicks) }}
                      </v-col>
                    </v-row>
                    <v-row v-if="item.OfficialRating" no-gutters>
                      <v-col cols="2" md="5" class="text--secondary">
                        {{ $t('item.rating') }}
                      </v-col>
                      <v-col cols="9" md="7">
                        {{ item.OfficialRating }}
                      </v-col>
                    </v-row>
                    <v-row
                      v-if="item.HomePageUrl || item.ExternalUrls.length > 0"
                      no-gutters
                    >
                      <v-col cols="2" md="5" class="text--secondary">
                        {{ $t('item.series.links') }}
                      </v-col>
                      <v-col cols="9" md="7" class="d-flex flex-column">
                        <a v-if="item.HomePageUrl" :src="item.HomePageUrl">
                          {{ $t('item.officialWebsite') }}
                        </a>
                        <a
                          v-for="(externalUrl, index) in item.ExternalUrls"
                          :key="index"
                          :src="externalUrl.Url"
                          v-text="externalUrl.Name"
                        />
                      </v-col>
                    </v-row>
                  </v-col>
                </v-row>
              </v-container>
            </v-tab-item>
          </v-tabs-items>
        </v-col>
      </v-row>
    </template>
    <template #right>
      <related-items :item="item" vertical />
    </template>
  </item-cols>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions, mapGetters, mapState } from 'vuex';
import { BaseItemDto, BaseItemPerson, ImageType } from '@jellyfin/client-axios';
import { Context } from '@nuxt/types';
import imageHelper from '~/mixins/imageHelper';
import formsHelper from '~/mixins/formsHelper';
import itemHelper from '~/mixins/itemHelper';
import timeUtils from '~/mixins/timeUtils';
import { isValidMD5 } from '~/utils/items';

export default Vue.extend({
  mixins: [imageHelper, formsHelper, itemHelper, timeUtils],
  validate(ctx: Context) {
    return isValidMD5(ctx.route.params.itemId);
  },
  async asyncData({ params, $userLibrary, store }) {
    const itemId = params.itemId;

    if (!store.getters['items/getItem'](itemId)) {
      await $userLibrary.getItem(itemId);
    }

    return { itemId };
  },
  data() {
    return {
      activeTab: 0,
      itemId: '' as string,
      parentItem: {} as BaseItemDto,
      backdropImageSource: '',
      currentVideoTrack: undefined as number | undefined,
      currentAudioTrack: undefined as number | undefined,
      currentSubtitleTrack: undefined as number | undefined
    };
  },
  head() {
    return {
      title: this.title
    };
  },
  computed: {
    ...mapGetters('items', ['getItem']),
    ...mapState('page', ['title']),
    item(): BaseItemDto {
      return this.getItem(this.itemId);
    },
    crew(): BaseItemPerson[] {
      let crew: BaseItemPerson[] = [];

      if (this.item.People) {
        crew = this.item.People.filter((person: BaseItemPerson) => {
          return ['Director', 'Writer'].includes(person.Type || '');
        });
      }

      return crew;
    },
    actors: {
      get(): BaseItemPerson[] {
        if (this.item.People) {
          return this.item.People.filter((person: BaseItemPerson) => {
            return person.Type === 'Actor';
          }).slice(0, 10);
        } else {
          return [];
        }
      }
    },
    directors: {
      get(): BaseItemPerson[] {
        return this.crew.filter(
          (person: BaseItemPerson) => person.Type === 'Director'
        );
      }
    },
    writers: {
      get(): BaseItemPerson[] {
        return this.crew.filter(
          (person: BaseItemPerson) => person.Type === 'Writer'
        );
      }
    },
    startDate(): Date | null {
      if (this.item.PremiereDate) {
        return this.$dateFns.format(new Date(this.item.PremiereDate), 'PPP', {
          locale: this.$i18n.locale
        });
      } else {
        return null;
      }
    },
    endDate: {
      get(): Date | null {
        if (this.item.EndDate) {
          return this.$dateFns.format(new Date(this.item.EndDate), 'PPP', {
            locale: this.$i18n.locale
          });
        } else {
          return null;
        }
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
  activated() {
    this.setAppBarOpacity({ opaqueAppBar: false });
  },
  deactivated() {
    this.setAppBarOpacity({ opaqueAppBar: true });
    this.clearBackdrop();
  },
  methods: {
    ...mapActions('page', ['setPageTitle', 'setAppBarOpacity']),
    ...mapActions('backdrop', ['setBackdrop', 'clearBackdrop'])
  }
});
</script>

<style scoped>
/* stylelint-disable */
.v-item-group::v-deep .v-slide-group__prev--disabled,
.v-item-group::v-deep .v-slide-group__next--disabled {
  display: none !important;
}
/* stylelint-enable */
</style>
