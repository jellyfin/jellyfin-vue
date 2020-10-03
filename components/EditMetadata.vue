<template>
  <v-card>
    <v-card-title class="headline">{{ $t('editMetadata') }}</v-card-title>

    <v-card-text>
      <v-form
        ref="form"
        v-model="validInputs"
        :disabled="saved"
        @submit.prevent="saveMetadata"
      >
        <v-tabs vertical>
          <v-tab>{{ $t('general') }}</v-tab>
          <v-tab>{{ $t('details') }}</v-tab>
          <v-tab>{{ $t('castAndCrew') }}</v-tab>
          <v-tab>{{ $t('images') }}</v-tab>
          <v-tab-item>
            <v-text-field
              v-model="editState.Path"
              outlined
              :label="$t('headerPaths')"
            ></v-text-field>
            <v-text-field
              v-model="editState.Name"
              outlined
              :label="$t('labelTitle')"
            ></v-text-field>
            <v-text-field
              v-model="editState.OriginalTitle"
              outlined
              :label="$t('labelOriginalTitle')"
            ></v-text-field>
            <v-text-field
              v-model="editState.SortName"
              outlined
              :label="$t('labelSortTitle')"
            ></v-text-field>
          </v-tab-item>
          <v-tab-item>
            <!-- <v-text-field
              v-model="editState.DateCreated"
              outlined
              :label="$t('labelDateAdded')"
            ></v-text-field> -->
            <date-input
              :value="dateCreated"
              :label="$t('labelDateAdded')"
              @update:date="(value) => saveDate('DateCreated', value)"
            ></date-input>
            <v-text-field
              v-model="editState.CommunityRating"
              outlined
              :label="$t('labelCommunityRating')"
            ></v-text-field>
            <v-text-field
              v-model="editState.CriticRating"
              outlined
              :label="$t('labelCriticRating')"
            ></v-text-field>
            <v-text-field
              v-model="editState.Taglines"
              outlined
              :label="$t('labelTagline')"
            ></v-text-field>
            <v-text-field
              v-model="editState.Overview"
              outlined
              :label="$t('labelOverview')"
            ></v-text-field>

            <date-input
              :value="premiereDate"
              :label="$t('labelReleaseDate')"
              @update:date="(value) => saveDate('PremiereDate', value)"
            ></date-input>
            <v-text-field
              v-model="editState.ProductionYear"
              outlined
              :label="$t('labelYear')"
            ></v-text-field>
            <v-text-field
              v-model="editState.OfficialRating"
              outlined
              :label="$t('labelParentalRating')"
            ></v-text-field>
            <v-text-field
              v-model="editState.CustomRating"
              outlined
              :label="$t('labelCustomRating')"
            ></v-text-field>
            <!-- <v-text-field
              v-model="editState"
              outlined
              :label="$t('labelOriginalAspectRatio')"
            ></v-text-field>
            <v-text-field
              v-model="editState"
              outlined
              :label="$t('label3DFormat')"
            ></v-text-field> -->
          </v-tab-item>
          <v-tab-item>
            <v-list subheader two-line>
              <v-subheader>{{ $t('people') }}</v-subheader>
              <v-list-item v-for="person in editState.People" :key="person.Id">
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
      <v-btn color="green darken-1" text @click="dialog = false"> Save </v-btn>
      <v-btn color="green darken-1" text @click="dialog = false">
        Cancel
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import Vue from 'vue';
import { format, formatISO } from 'date-fns';
import { BaseItemDto } from '~/api';

export default Vue.extend({
  props: {
    metadata: {
      type: Object,
      default: () => ({})
    }
  },

  data() {
    return {
      editState: {} as BaseItemDto,
      saved: false,
      validInputs: true,
      menu: false
    };
  },
  computed: {
    premiereDate: {
      get() {
        if (!this.editState.PremiereDate) return '';
        const dateStr = format(
          new Date(this.editState.PremiereDate),
          'yyyy-MM-dd'
        );
        return dateStr;
      }
    },
    dateCreated: {
      get() {
        if (!this.editState.DateCreated) return '';
        const dateStr = format(
          new Date(this.editState.DateCreated),
          'yyyy-MM-dd'
        );
        return dateStr;
      }
    }
  },
  watch: {
    metadata(value) {
      this.editState = value;
    }
  },
  methods: {
    saveMetadata() {
      console.log(this.editState);
    },
    saveDate(key: string, date: string) {
      this.menu = false;
      this.editState = Object.assign({}, this.editState, {
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
