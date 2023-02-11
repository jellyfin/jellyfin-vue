<template>
  <v-card height="100%" class="d-flex flex-column metadata-editor">
    <v-card-title>{{ $t('editMetadata') }}</v-card-title>
    <v-card-subtitle class="pb-3">
      {{ metadata.Path }}
    </v-card-subtitle>

    <v-divider />

    <v-card-text class="pa-0 flex-grow-1">
      <v-tabs v-model="tabName" :vertical="!$vuetify.display.mobile">
        <v-tab href="#general">{{ $t('general') }}</v-tab>
        <v-tab href="#details">{{ $t('details') }}</v-tab>
        <v-tab href="#castAndCrew">{{ $t('castAndCrew') }}</v-tab>
        <v-tab href="#images">{{ $t('images') }}</v-tab>

        <v-tabs v-model="tabName" class="pa-3">
          <v-tab value="general">
            <v-text-field
              v-model="metadata.Name"
              variant="outlined"
              :label="$t('metadata.title')" />
            <v-text-field
              v-model="metadata.OriginalTitle"
              variant="outlined"
              :label="$t('originalTitle')" />
            <v-text-field
              v-model="metadata.ForcedSortName"
              variant="outlined"
              :label="$t('sortTitle')" />
            <v-text-field
              v-model="metadata.Taglines"
              variant="outlined"
              :label="$t('tagline')" />
            <v-textarea
              v-model="metadata.Overview"
              variant="outlined"
              no-resize
              rows="4"
              :label="$t('overview')" />
          </v-tab>
          <v-tab value="details">
            <date-input
              :value="dateCreated"
              :label="$t('dateAdded')"
              @update:date="(value) => saveDate('DateCreated', value)" />
            <v-row>
              <v-col sm="6" cols="12">
                <v-text-field
                  v-model="metadata.CommunityRating"
                  variant="outlined"
                  :label="$t('communityRating')" />
              </v-col>
              <v-col sm="6" cols="12">
                <v-text-field
                  v-model="metadata.CriticRating"
                  variant="outlined"
                  :label="$t('criticRating')" />
              </v-col>
            </v-row>

            <date-input
              :value="premiereDate"
              :label="$t('releaseDate')"
              @update:date="(value) => saveDate('PremiereDate', value)" />
            <v-text-field
              v-model="metadata.ProductionYear"
              variant="outlined"
              :label="$t('year')" />
            <v-text-field
              v-model="metadata.OfficialRating"
              variant="outlined"
              :label="$t('parentalRating')" />
            <v-text-field
              v-model="metadata.CustomRating"
              variant="outlined"
              :label="$t('customRating')" />
            <v-combobox
              v-model="metadata.Genres"
              v-model:search-input="search"
              :items="genres"
              :label="$t('genres')"
              hide-selected
              multiple
              variant="outlined"
              small-chips>
              <template #no-data>
                <v-list-item>
                  <v-list-item-title>
                    {{ $t('metadataNoResultsMatching', { search: search }) }}
                  </v-list-item-title>
                </v-list-item>
              </template>
            </v-combobox>
            <v-combobox
              v-model="metadata.Tags"
              v-model:search-input="search"
              :items="genres"
              :label="$t('tags')"
              hide-selected
              multiple
              variant="outlined"
              small-chips>
              <template #no-data>
                <v-list-item>
                  <v-list-item-title>
                    {{ $t('metadataNoResultsMatching', { search: search }) }}
                  </v-list-item-title>
                </v-list-item>
              </template>
            </v-combobox>
          </v-tab>
          <v-tab value="castAndCrew">
            <v-list lines="two">
              <v-list-item @click="(e) => handlePersonEdit()">
                <v-list-item-title>
                  {{ $t('addNewPerson') }}
                </v-list-item-title>
                <v-list-item-action>
                  <v-icon>
                    <i-mdi-plus-circle />
                  </v-icon>
                </v-list-item-action>
              </v-list-item>
              <v-list-item
                v-for="(item, i) in metadata.People"
                :key="`${item.Id}-${i}`"
                @click="handlePersonEdit(item)">
                <v-avatar>
                  <v-img
                    v-if="item.PrimaryImageTag"
                    :src="
                      $remote.sdk.api?.getItemImageUrl(
                        item.Id || '',
                        ImageType.Primary
                      )
                    " />
                  <v-icon v-else class="bg-grey-darken-3">
                    <i-mdi-account />
                  </v-icon>
                </v-avatar>
                <v-list-item-title>
                  {{ item.Name }}
                </v-list-item-title>
                <v-list-item-subtitle class="mt-1">
                  {{ item.Role || item.Type }}
                </v-list-item-subtitle>
                <v-list-item-action @click.stop="handlePersonDel(i)">
                  <v-icon>
                    <i-mdi-delete />
                  </v-icon>
                </v-list-item-action>
              </v-list-item>
            </v-list>
          </v-tab>
          <v-tab value="images">
            <image-editor :metadata="metadata" />
          </v-tab>
        </v-tabs>
      </v-tabs>
    </v-card-text>

    <v-divider />
    <v-card-actions
      class="d-flex align-center pa-3"
      :class="{
        'justify-end': !$vuetify.display.mobile,
        'justify-center': $vuetify.display.mobile
      }">
      <v-btn
        variant="flat"
        width="8em"
        color="secondary"
        class="mr-1"
        @click="$emit('cancel')">
        {{ $t('cancel') }}
      </v-btn>
      <v-btn
        variant="flat"
        width="8em"
        color="primary"
        :loading="loading"
        @click="saveMetadata">
        {{ $t('save') }}
      </v-btn>
    </v-card-actions>
    <person-editor
      v-model:dialog="dialog"
      :person="person"
      @update:person="handlePersonUpdate"
      @update:dialog="handleDialogUpdate" />
  </v-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { pick, set } from 'lodash-es';
import { AxiosError } from 'axios';
import {
  BaseItemDto,
  BaseItemPerson,
  ImageType
} from '@jellyfin/sdk/lib/generated-client';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { getGenresApi } from '@jellyfin/sdk/lib/utils/api/genres-api';
import { getItemUpdateApi } from '@jellyfin/sdk/lib/utils/api/item-update-api';
import { format, formatISO } from 'date-fns';
import { useDateFns, useSnackbar } from '@/composables';

export default defineComponent({
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
  setup() {
    return {
      useSnackbar,
      ImageType
    };
  },
  data() {
    return {
      metadata: {} as BaseItemDto,
      menu: false,
      dialog: false,
      person: null as BaseItemPerson | null,
      genres: [] as BaseItemDto[] | null | undefined,
      search: '',
      loading: false,
      tabName: null
    };
  },
  computed: {
    premiereDate(): string {
      if (!this.metadata.PremiereDate) {
        return '';
      }

      return useDateFns(
        format,
        new Date(this.metadata.PremiereDate),
        'yyyy-MM-dd'
      ).value;
    },
    dateCreated(): string {
      if (!this.metadata.DateCreated) {
        return '';
      }

      return useDateFns(
        format,
        new Date(this.metadata.DateCreated),
        'yyyy-MM-dd'
      ).value;
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

      if (!this.metadata.Id) {
        return;
      }

      const ancestors = await this.$remote.sdk
        .newUserApi(getLibraryApi)
        .getAncestors({
          itemId: this.metadata.Id,
          userId: this.$remote.auth.currentUserId
        });
      const libraryInfo = ancestors.data.find(
        (index) => index.Type === 'CollectionFolder'
      );

      if (!libraryInfo || !libraryInfo.Id) {
        return;
      }

      this.getGenres(libraryInfo.Id);
    },
    async fetchItemInfo(): Promise<void> {
      const itemInfo = (
        await this.$remote.sdk.newUserApi(getUserLibraryApi).getItem({
          userId: this.$remote.auth.currentUserId || '',
          itemId: this.itemId
        })
      ).data;

      this.$data.metadata = itemInfo;
    },
    async getGenres(parentId: string): Promise<void> {
      this.genres =
        (
          await this.$remote.sdk.newUserApi(getGenresApi).getGenres({
            parentId
          })
        ).data.Items?.map((index) => index.Name).filter(
          (genre): genre is string => !!genre
        ) ?? [];
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

        if (!this.metadata.Id) {
          throw new Error('Expected metadata to have id');
        }

        await this.$remote.sdk.newUserApi(getItemUpdateApi).updateItem({
          itemId: this.metadata.Id,
          baseItemDto: item
        });
        this.$emit('save');
        this.loading = false;
        this.useSnackbar(this.$t('saved'), 'success');
      } catch (error) {
        // TODO: This whole block should be removed - we should verify that the data is correct client-side before posting to server
        // not expecting bad request messages.
        // TODO: Revise similar blocks like this through the entire codebase.
        let errorMessage = this.$t('unexpectedError');

        if (error instanceof AxiosError && error.response?.status === 400) {
          errorMessage = this.$t('badRequest');
        }

        this.useSnackbar(errorMessage, 'error');
      }
    },
    saveDate(key: string, date: string): void {
      this.menu = false;
      set(this.metadata, key, formatISO(new Date(date)));
    },
    handlePersonEdit(item: BaseItemPerson): void {
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
      (this.metadata.People ?? []).splice(index, 1);
    }
  }
});
</script>

<style lang="scss" scoped>
.person-icon {
  background-color: rgb(var(--v-secondary-darken1));
}

:deep(.v-card__text) {
  overflow: hidden;
}

:deep(.v-tabs) {
  height: 100%;
}

:deep(.v-tabs-bar) {
  overflow: hidden;
  border-right: 1px solid var(--v-secondary-lighten1);
}

:deep(.v-tabs-items) {
  overflow-y: scroll;
}

:deep(.v-card__actions) {
  width: 100%;
}
</style>
