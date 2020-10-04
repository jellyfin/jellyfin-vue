<template>
  <v-card>
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
              :label="$t('labelTitle')"
            ></v-text-field>
            <v-text-field
              v-model="metadata.OriginalTitle"
              outlined
              :label="$t('labelOriginalTitle')"
            ></v-text-field>
            <v-text-field
              v-model="metadata.ForcedSortName"
              outlined
              :label="$t('labelSortTitle')"
            ></v-text-field>
          </v-tab-item>
          <v-tab-item>
            <!-- <v-text-field
              v-model="metadata.DateCreated"
              outlined
              :label="$t('labelDateAdded')"
            ></v-text-field> -->
            <date-input
              :value="dateCreated"
              :label="$t('labelDateAdded')"
              @update:date="(value) => saveDate('DateCreated', value)"
            ></date-input>
            <v-text-field
              v-model="metadata.CommunityRating"
              outlined
              :label="$t('labelCommunityRating')"
            ></v-text-field>
            <v-text-field
              v-model="metadata.CriticRating"
              outlined
              :label="$t('labelCriticRating')"
            ></v-text-field>
            <v-text-field
              v-model="metadata.Taglines"
              outlined
              :label="$t('labelTagline')"
            ></v-text-field>
            <v-text-field
              v-model="metadata.Overview"
              outlined
              :label="$t('labelOverview')"
            ></v-text-field>

            <date-input
              :value="premiereDate"
              :label="$t('labelReleaseDate')"
              @update:date="(value) => saveDate('PremiereDate', value)"
            ></date-input>
            <v-text-field
              v-model="metadata.ProductionYear"
              outlined
              :label="$t('labelYear')"
            ></v-text-field>
            <v-text-field
              v-model="metadata.OfficialRating"
              outlined
              :label="$t('labelParentalRating')"
            ></v-text-field>
            <v-text-field
              v-model="metadata.CustomRating"
              outlined
              :label="$t('labelCustomRating')"
            ></v-text-field>
          </v-tab-item>
          <v-tab-item>
            <v-list subheader two-line>
              <v-subheader
                >{{ $t('people') }}
                <v-icon class="ml-2" @click="(e) => handlePersonEdit()"
                  >mdi-plus-circle</v-icon
                ></v-subheader
              >
              <v-list-item
                v-for="(item, i) in metadata.People"
                :key="i"
                @click="handlePersonEdit(item)"
              >
                <v-list-item-avatar>
                  <v-icon class="person-icon">mdi-account</v-icon>
                </v-list-item-avatar>
                <v-list-item-content>{{ item.Name }}</v-list-item-content>
                <v-list-item-action @click.stop="handlePersonDel(i)">
                  <v-icon>mdi-delete</v-icon>
                </v-list-item-action>
              </v-list-item>
            </v-list>
          </v-tab-item>
        </v-tabs>
      </v-form>
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn depressed>Cancel</v-btn>
      <v-btn depressed color="primary" @click="saveMetadata">Save</v-btn>
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
import { format, formatISO } from 'date-fns';
import { pick } from 'lodash';
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
      person: null as BaseItemPerson | null
    };
  },
  computed: {
    premiereDate: {
      get() {
        if (!this.metadata.PremiereDate) return '';
        const dateStr = format(
          new Date(this.metadata.PremiereDate),
          'yyyy-MM-dd'
        );
        return dateStr;
      }
    },
    dateCreated: {
      get() {
        if (!this.metadata.DateCreated) return '';
        const dateStr = format(
          new Date(this.metadata.DateCreated),
          'yyyy-MM-dd'
        );
        return dateStr;
      }
    }
  },
  watch: {
    itemId() {
      this.fetchItemInfo();
    }
  },
  created() {
    this.fetchItemInfo();
  },
  methods: {
    async fetchItemInfo() {
      const userId = this.$auth.user.Id;
      const itemInfo = (
        await this.$userLibraryApi.getItem({
          userId,
          itemId: this.itemId
        })
      ).data;
      this.$data.metadata = itemInfo;
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
        await this.$itemUpdateApi.updateItem({
          itemId: this.metadata.Id as string,
          baseItemDto: item
        });
        // TODO: show success toast
        console.log('saved');
      } catch (err) {
        console.log(err);
      }
    },
    saveDate(key: string, date: string) {
      this.menu = false;
      this.metadata = Object.assign({}, this.metadata, {
        [key]: formatISO(new Date(date))
      });
    },
    handlePersonEdit(item: BaseItemPerson | null = null) {
      this.person = item;
      this.dialog = true;
    },
    handlePersonUpdate(item: BaseItemPerson) {
      if (!this.metadata.People) {
        this.metadata.People = [];
      }
      const { Id } = item;
      const target = this.metadata.People?.find((person) => person.Id === Id);
      console.log(JSON.stringify(target, null, 4));
      if (target) {
        Object.assign(target, item);
      } else {
        this.metadata.People.push(item);
      }
      console.log(this.metadata.People, target, item);
    },
    handlePersonDel(index: number) {
      (this.metadata.People as BaseItemPerson[]).splice(index, 1);
      console.log(this.metadata.People);
    }
  }
});
</script>
<style scoped>
.person-icon {
  background-color: var(--v-secondary-darken1);
}
</style>
