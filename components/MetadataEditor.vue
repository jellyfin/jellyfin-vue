<template>
  <v-card height="90vh">
    <v-card-title class="headline">{{ $t('editMetadata') }}</v-card-title>
    <v-card-text>
      <v-form ref="form" :disabled="saved">
        <v-tabs vertical>
          <v-tab>{{ $t('general') }}</v-tab>
          <v-tab>{{ $t('details') }}</v-tab>
          <v-tab>{{ $t('castAndCrew') }}</v-tab>
          <v-tab>{{ $t('images') }}</v-tab>
          <v-tab-item>
            <v-text-field
              v-model="metadata.Path"
              outlined
              :label="$t('headerPaths')"
            ></v-text-field>
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
          </v-tab-item>
          <v-tab-item>
            <date-input
              :value="dateCreated"
              :label="$t('dateAdded')"
              @update:date="(value) => saveDate('DateCreated', value)"
            ></date-input>
            <v-text-field
              v-model="metadata.CommunityRating"
              outlined
              :label="$t('communityRating')"
            ></v-text-field>
            <v-text-field
              v-model="metadata.CriticRating"
              outlined
              :label="$t('criticRating')"
            ></v-text-field>
            <v-text-field
              v-model="metadata.Taglines"
              outlined
              :label="$t('tagline')"
            ></v-text-field>
            <v-textarea
              v-model="metadata.Overview"
              outlined
              auto-grow
              :label="$t('overview')"
            ></v-textarea>

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
              <template v-slot:no-data>
                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-title>
                      No results matching "
                      <strong>{{ search }}</strong>
                      ". Press
                      <kbd>enter</kbd>
                      to create a new one
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
              <template v-slot:no-data>
                <v-list-item>
                  <v-list-item-content>
                    <v-list-item-title>
                      No results matching "
                      <strong>{{ search }}</strong>
                      ". Press
                      <kbd>enter</kbd>
                      to create a new one
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </template>
            </v-combobox>
          </v-tab-item>
          <v-tab-item>
            <v-list subheader two-line>
              <v-subheader>
                {{ $t('people') }}
                <v-icon class="ml-2" @click="(e) => handlePersonEdit()">
                  mdi-plus-circle
                </v-icon>
              </v-subheader>
              <v-list-item
                v-for="(item, i) in metadata.People"
                :key="i"
                @click="handlePersonEdit(item)"
              >
                <v-list-item-avatar>
                  <v-icon class="person-icon">mdi-account</v-icon>
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
          <v-tab-item>
            <image-editor :metadata="metadata"></image-editor>
          </v-tab-item>
        </v-tabs>
      </v-form>
    </v-card-text>

    <v-card-actions class="d-flex justify-center align-center">
      <v-btn @click="$emit('cancel')">Cancel</v-btn>
      <v-btn color="primary" @click="saveMetadata" :loading="loading">
        Save
      </v-btn>
    </v-card-actions>
    <person-editor
      :person="person"
      :dialog.sync="dialog"
      @update:person="handlePersonUpdate"
    ></person-editor>
  </v-card>
</template>

<script lang="ts">
import Vue from 'vue';
import { pick, set } from 'lodash';
import { BaseItemDto, BaseItemPerson } from '~/api';

export default Vue.extend({
  props: {
    itemId: {
      type: String,
      default: ''
    }
  },

  data() {
    return {
      metadata: {} as BaseItemDto,
      saved: false,
      menu: false,
      dialog: false,
      person: null as BaseItemPerson | null,
      genders: [] as BaseItemDto[] | null | undefined,
      search: '',
      loading: false
    };
  },
  computed: {
    premiereDate: {
      get() {
        if (!this.metadata.PremiereDate) return '';
        const dateStr = this.$dateFns.format(
          new Date(this.metadata.PremiereDate),
          'yyyy-MM-dd'
        );
        return dateStr;
      }
    },
    dateCreated: {
      get() {
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
    itemId() {
      this.getData();
    }
  },
  created() {
    this.getData();
  },
  methods: {
    async getData() {
      await this.fetchItemInfo();
      const libraryInfo =
        (await this.getAncestors()).data.find(
          (i) => i.Type === 'CollectionFolder'
        ) || {};
      this.getGenres(libraryInfo.Id);
    },
    async fetchItemInfo() {
      const userId = this.$auth.user.Id;
      const itemInfo = (
        await this.$api.userLibrary.getItem({
          userId,
          itemId: this.itemId
        })
      ).data;
      this.$data.metadata = itemInfo;
    },
    async getGenres(parentId = '') {
      this.genders = (
        await this.$api.genres.getGenres({
          parentId
        })
      ).data.Items?.map((i) => i.Name) as BaseItemDto[];
    },
    async getAncestors() {
      return await this.$api.library.getAncestors({
        itemId: this.metadata.Id as string,
        userId: this.$auth.user.Id
      });
    },
    async saveMetadata() {
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
          message: 'saved',
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
    saveDate(key: string, date: string) {
      this.menu = false;
      set(this.metadata, key, this.$dateFns.formatISO(new Date(date)));
    },
    handlePersonEdit(item: BaseItemPerson | null = null) {
      this.person = item;
      this.dialog = true;
    },
    handlePersonUpdate(item: BaseItemPerson) {
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
    handlePersonDel(index: number) {
      (this.metadata.People as BaseItemPerson[]).splice(index, 1);
    }
  }
});
</script>
<style scoped>
.person-icon {
  background-color: var(--v-secondary-darken1);
}
.headline {
  border-bottom: 1px solid #000;
  margin-bottom: 20px;
}
</style>
