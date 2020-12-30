<template>
  <v-card height="100%" class="d-flex flex-column metadata-editor">
    <v-card-title>{{ $t('editMetadata') }}</v-card-title>
    <v-card-subtitle class="pb-3">
      {{ metadata.Path }}
    </v-card-subtitle>

    <v-divider></v-divider>

    <v-card-text class="pa-0 flex-grow-1">
      <v-tabs v-model="tabName" :vertical="!$vuetify.breakpoint.mobile">
        <v-tab href="#general">{{ $t('general') }}</v-tab>
        <v-tab href="#details">{{ $t('details') }}</v-tab>
        <v-tab href="#castAndCrew">{{ $t('castAndCrew') }}</v-tab>
        <v-tab href="#images">{{ $t('images') }}</v-tab>

        <v-tabs-items v-model="tabName" class="pa-3">
          <v-tab-item value="general">
            <v-text-field
              v-model="metadata.Name"
              outlined
              :label="$t('title')"
            ></v-text-field>
            <v-text-field
              v-model="metadata.OriginalTitle"
              outlined
              :label="$t('originalTitle')"
            ></v-text-field>
            <v-text-field
              v-model="metadata.ForcedSortName"
              outlined
              :label="$t('sortTitle')"
            ></v-text-field>
            <v-text-field
              v-model="metadata.Taglines"
              outlined
              :label="$t('tagline')"
            ></v-text-field>
            <v-textarea
              v-model="metadata.Overview"
              outlined
              no-resize
              rows="4"
              :label="$t('overview')"
            ></v-textarea>
          </v-tab-item>
          <v-tab-item value="details">
            <date-input
              :value="dateCreated"
              :label="$t('dateAdded')"
              @update:date="(value) => saveDate('DateCreated', value)"
            ></date-input>
            <v-row>
              <v-col sm="6" cols="12">
                <v-text-field
                  v-model="metadata.CommunityRating"
                  outlined
                  :label="$t('communityRating')"
                ></v-text-field>
              </v-col>
              <v-col sm="6" cols="12">
                <v-text-field
                  v-model="metadata.CriticRating"
                  outlined
                  :label="$t('criticRating')"
                ></v-text-field>
              </v-col>
            </v-row>

            <date-input
              :value="premiereDate"
              :label="$t('releaseDate')"
              @update:date="(value) => saveDate('PremiereDate', value)"
            ></date-input>
            <v-text-field
              v-model="metadata.ProductionYear"
              outlined
              :label="$t('year')"
            ></v-text-field>
            <v-text-field
              v-model="metadata.OfficialRating"
              outlined
              :label="$t('parentalRating')"
            ></v-text-field>
            <v-text-field
              v-model="metadata.CustomRating"
              outlined
              :label="$t('customRating')"
            ></v-text-field>
            <v-combobox
              v-model="metadata.Genres"
              :items="genders"
              :search-input.sync="search"
              :label="$t('genres')"
              hide-selected
              multiple
              outlined
              small-chips
            >
              <template #no-data>
                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-title>
                      {{ $t('metadataNoResultsMatching', { search: search }) }}
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </template>
            </v-combobox>
            <v-combobox
              v-model="metadata.Tags"
              :items="genders"
              :search-input.sync="search"
              :label="$t('tags')"
              hide-selected
              multiple
              outlined
              small-chips
            >
              <template #no-data>
                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-title>
                      {{ $t('metadataNoResultsMatching', { search: search }) }}
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </template>
            </v-combobox>
          </v-tab-item>
          <v-tab-item value="castAndCrew">
            <v-list two-line>
              <v-list-item @click="(e) => handlePersonEdit()">
                <v-list-item-content>
                  <v-list-item-title>
                    {{ $t('addNewPerson') }}
                  </v-list-item-title>
                </v-list-item-content>
                <v-list-item-action>
                  <v-icon>mdi-plus-circle</v-icon>
                </v-list-item-action>
              </v-list-item>
              <v-list-item
                v-for="(item, i) in metadata.People"
                :key="`${item.Id}-${i}`"
                @click="handlePersonEdit(item)"
              >
                <v-list-item-avatar>
                  <v-img
                    v-if="item.PrimaryImageTag"
                    :src="`${$axios.defaults.baseURL}/Items/${item.Id}/Images/Primary`"
                  />
                  <v-icon v-else class="grey darken-3">mdi-account</v-icon>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title>
                    {{ item.Name }}
                  </v-list-item-title>
                  <v-list-item-subtitle class="mt-1">
                    {{ item.Role || item.Type }}
                  </v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action @click.stop="handlePersonDel(i)">
                  <v-icon>mdi-delete</v-icon>
                </v-list-item-action>
              </v-list-item>
            </v-list>
          </v-tab-item>
          <v-tab-item value="images">
            <image-editor :metadata="metadata"></image-editor>
          </v-tab-item>
        </v-tabs-items>
      </v-tabs>
    </v-card-text>

    <v-divider></v-divider>
    <v-card-actions
      class="d-flex align-center pa-3"
      :class="{
        'justify-end': !$vuetify.breakpoint.mobile,
        'justify-center': $vuetify.breakpoint.mobile
      }"
    >
      <v-btn
        depressed
        width="8em"
        color="secondary"
        class="mr-1"
        @click="$emit('cancel')"
      >
        {{ $t('cancel') }}
      </v-btn>
      <v-btn
        depressed
        width="8em"
        color="primary"
        :loading="loading"
        @click="saveMetadata"
      >
        {{ $t('save') }}
      </v-btn>
    </v-card-actions>
    <person-editor
      :person="person"
      :dialog.sync="dialog"
      @update:person="handlePersonUpdate"
      @update:dialog="handleDialogUpdate"
    ></person-editor>
  </v-card>
</template>

<script lang="ts">
import Vue from 'vue';
import { pick, set } from 'lodash';
import { BaseItemDto, BaseItemPerson } from '@jellyfin/client-axios';

export default Vue.extend({
  props: {
    itemId: {
      type: String,
      default: ''
    },
    forceRefresh: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      metadata: {} as BaseItemDto,
      menu: false,
      dialog: false,
      person: null as BaseItemPerson | null,
      genders: [] as BaseItemDto[] | null | undefined,
      search: '',
      loading: false,
      tabName: null
    };
  },
  computed: {
    premiereDate: {
      get(): string {
        if (!this.metadata.PremiereDate) return '';
        const dateStr = this.$dateFns.format(
          new Date(this.metadata.PremiereDate),
          'yyyy-MM-dd'
        );
        return dateStr;
      }
    },
    dateCreated: {
      get(): string {
        if (!this.metadata.DateCreated) return '';
        const dateStr = this.$dateFns.format(
          new Date(this.metadata.DateCreated),
          'yyyy-MM-dd'
        );
        return dateStr;
      }
    }
  },
  watch: {
    itemId(): void {
      this.getData();
    },
    forceRefresh(): void {
      this.getData();
      this.$emit('update:forceRefresh', false);
    }
  },
  created() {
    this.getData();
  },
  methods: {
    async getData(): Promise<void> {
      await this.fetchItemInfo();
      const ancestors = await this.$api.library.getAncestors({
        itemId: this.metadata.Id as string,
        userId: this.$auth.user.Id
      });
      const libraryInfo =
        ancestors.data.find((i) => i.Type === 'CollectionFolder') || {};
      this.getGenres(libraryInfo.Id);
    },
    async fetchItemInfo(): Promise<void> {
      const userId = this.$auth.user.Id;
      const itemInfo = (
        await this.$api.userLibrary.getItem({
          userId,
          itemId: this.itemId
        })
      ).data;
      this.$data.metadata = itemInfo;
    },
    async getGenres(parentId = ''): Promise<void> {
      this.genders = (
        await this.$api.genres.getGenres({
          parentId
        })
      ).data.Items?.map((i) => i.Name) as BaseItemDto[];
    },
    async saveMetadata(): Promise<void> {
      const item = pick(this.metadata, [
        'Id',
        'Name',
        'OriginalTitle',
        'ForcedSortName',
        'CommunityRating',
        'CriticRating',
        'IndexNumber',
        'AirsBeforeSeasonNumber',
        'AirsAfterSeasonNumber',
        'AirsBeforeEpisodeNumber',
        'ParentIndexNumber',
        'DisplayOrder',
        'Album',
        'AlbumArtists',
        'ArtistItems',
        'Overview',
        'Status',
        'AirDays',
        'AirTime',
        'Genres',
        'Tags',
        'Studios',
        'PremiereDate',
        'DateCreated',
        'EndDate',
        'ProductionYear',
        'AspectRatio',
        'Video3DFormat',
        'OfficialRating',
        'CustomRating',
        'People',
        'LockData',
        'LockedFields',
        'ProviderIds',
        'PreferredMetadataLanguage',
        'PreferredMetadataCountryCode',
        'Taglines'
      ]);
      try {
        this.loading = true;
        await this.$api.itemUpdate.updateItem({
          itemId: this.metadata.Id as string,
          baseItemDto: item
        });
        this.$emit('save');
        this.loading = false;
        this.$store.dispatch('snackbar/display', {
          message: this.$t('saved'),
          color: 'success'
        });
      } catch (error) {
        let errorMessage = this.$t('unexpectedError');

        if (error.response.status === 400) {
          errorMessage = this.$t('badRequest');
        }

        this.$store.dispatch('snackbar/display', {
          message: errorMessage.toString(),
          color: 'error'
        });
      }
    },
    saveDate(key: string, date: string): void {
      this.menu = false;
      set(this.metadata, key, this.$dateFns.formatISO(new Date(date)));
    },
    handlePersonEdit(item: BaseItemPerson | null = null): void {
      this.person = item;
      this.dialog = true;
    },
    handlePersonUpdate(item: BaseItemPerson): void {
      if (!this.metadata.People) {
        this.metadata.People = [];
      }
      const target = this.metadata.People?.find(
        (person) => person.Id === item.Id
      );
      if (target) {
        Object.assign(target, item);
      } else {
        this.metadata.People.push(item);
      }
    },
    handleDialogUpdate(result: boolean): void {
      this.dialog = result;
    },
    handlePersonDel(index: number): void {
      (this.metadata.People as BaseItemPerson[]).splice(index, 1);
    }
  }
});
</script>
<style scoped>
.person-icon {
  background-color: var(--v-secondary-darken1);
}
.metadata-editor >>> .v-card__text {
  overflow: hidden;
}
.metadata-editor >>> .v-tabs {
  height: 100%;
}
.metadata-editor >>> .v-tabs-bar {
  overflow: hidden;
  border-right: 1px solid var(--v-secondary-lighten1);
}
.metadata-editor >>> .v-tabs-items {
  overflow-y: scroll;
}

.metadata-editor >>> .v-card__actions {
  width: 100%;
}
</style>
