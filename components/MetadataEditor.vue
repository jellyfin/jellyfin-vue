<template>
  <v-card>
    <v-card-title class="headline">{{ $t('editMetadata') }}</v-card-title>
    <v-card-text>
      <v-form ref="form" :disabled="saved" @submit.prevent="saveMetadata">
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
            <!-- <v-text-field
              v-model="metadata"
              outlined
              :label="$t('labelOriginalAspectRatio')"
            ></v-text-field>
            <v-text-field
              v-model="metadata"
              outlined
              :label="$t('label3DFormat')"
            ></v-text-field> -->
          </v-tab-item>
          <v-tab-item>
            <v-list subheader two-line>
              <v-subheader>{{ $t('people') }}</v-subheader>
              <v-list-item v-for="person in metadata.People" :key="person.Id">
                <v-list-item-avatar
                  ><v-icon class="person-icon"
                    >mdi-account</v-icon
                  ></v-list-item-avatar
                >
                <v-list-item-content>{{ person.Name }}</v-list-item-content>
                <v-list-item-action
                  ><v-icon>mdi-delete</v-icon></v-list-item-action
                ></v-list-item
              ></v-list
            ></v-tab-item
          >
        </v-tabs>
      </v-form>
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn depressed> Cancel </v-btn>
      <v-btn depressed color="primary" @click="saveMetadata"> Save </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import Vue from 'vue';
import { format, formatISO } from 'date-fns';
import { pick } from 'lodash';
import { BaseItemDto } from '~/api';

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
      menu: false
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
    }
  }
});
</script>
<style scoped>
.person-icon {
  background-color: var(--v-secondary-darken1);
}
</style>
