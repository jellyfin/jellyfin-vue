<template>
  <v-list color="transparent" two-line>
    <div v-if="items.length > 0">
      <v-list-item
        v-for="(item, index) in items"
        :key="`${item.Id}-${index}`"
        nuxt
        :to="getItemDetailsLink(item, 'Person')"
      >
        <v-list-item-avatar>
          <v-img
            v-if="item.PrimaryImageTag"
            ref="personImg"
            :src="getImageUrl(item.Id)"
          />
          <v-icon v-else class="grey darken-3">mdi-account</v-icon>
        </v-list-item-avatar>
        <v-list-item-content>
          <v-list-item-title>{{ item.Name }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ item.Role || item.Type }}
          </v-list-item-subtitle>
        </v-list-item-content>
      </v-list-item>
    </div>
    <div
      v-for="index in skeletonLength"
      v-else
      :key="index"
      class="d-flex align-center mt-5 mb-5"
    >
      <v-skeleton-loader type="avatar" class="ml-3 mr-3" />
      <v-skeleton-loader type="sentences" width="10em" class="pr-5" />
    </div>
  </v-list>
</template>

<script lang="ts">
import Vue from 'vue';
import { BaseItemPerson, ImageType } from '@jellyfin/client-axios';
import imageHelper from '~/mixins/imageHelper';
import itemHelper from '~/mixins/itemHelper';

export default Vue.extend({
  mixins: [imageHelper, itemHelper],
  props: {
    items: {
      type: Array,
      default: (): BaseItemPerson[] => {
        return [];
      }
    },
    skeletonLength: {
      type: Number,
      default: 0
    }
  },
  methods: {
    getImageUrl(itemId: string): string | undefined {
      const element = this.$refs.personImg as HTMLElement;

      return this.getImageUrlForElement(ImageType.Primary, {
        itemId,
        element
      });
    }
  }
});
</script>
