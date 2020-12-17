<template>
  <v-container fill-height fluid class="pa-0">
    <video-player
      v-if="item.MediaType === 'Video' || item.MediaType === 'Audio'"
      :item="item"
      :poster="poster"
      @error="handleShakaPlayerError"
    />

    <v-dialog v-model="errorDialog" :width="smallModalWidth">
      <v-card>
        <v-card-title class="headline">
          {{ $t('errors.anErrorHappened') }}
        </v-card-title>

        <v-card-text>
          <p>{{ $t('errors.messages.videoPlayerError') }}</p>

          <p class="mb-0">
            {{ $t('errors.messages.errorCode', { errorCode }) }}
          </p>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn color="primary" text @click="dismissError">
            {{ $t('buttons.ok') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { Route } from 'vue-router';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import ErrorEvent from 'shaka-player';
import { BaseItemDto, ImageType } from '@jellyfin/client-axios';
import modalHelper from '~/mixins/modalHelper';
import imageHelper from '~/mixins/imageHelper';

export default Vue.extend({
  mixins: [imageHelper, modalHelper],
  layout: 'fullpage',
  data() {
    return {
      errorCode: '',
      errorDialog: false,
      fromRoute: null as null | Route,
      item: [] as BaseItemDto,
      poster: ''
    };
  },
  async beforeMount() {
    try {
      const response = await this.$api.items.getItems({
        userId: this.$auth.user.Id,
        ids: [this.$route.params.itemId]
      });

      if (response?.data?.Items?.[0]) {
        this.item = response.data.Items[0];
      } else {
        throw new Error('Item not found');
      }

      this.poster = this.getImageUrlForElement(this.item, ImageType.Backdrop);
    } catch (error) {
      this.$nuxt.error({
        statusCode: 404,
        message: error
      });
    }
  },
  methods: {
    handleShakaPlayerError(error: ErrorEvent) {
      if (error?.detail?.severity === 1) {
        // This error is recoverable, ignore for now
      } else {
        this.errorCode = error?.detail?.code;
        this.errorDialog = true;
      }
    },
    dismissError() {
      this.errorDialog = false;
      this.$router.back();
    }
  }
});
</script>
