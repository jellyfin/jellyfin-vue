<template>
  <v-btn :dark="dark" icon @click.stop.prevent="toggleFavorite">
    <v-icon v-if="isFavorite">mdi-heart</v-icon>
    <v-icon v-else>mdi-heart-outline</v-icon>
  </v-btn>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import { BaseItemDto } from '@jellyfin/client-axios';
import { mapStores } from 'pinia';
import { authStore, snackbarStore, socketStore } from '~/store';

export default Vue.extend({
  props: {
    item: {
      type: Object as PropType<BaseItemDto>,
      required: true
    },
    dark: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isFavorite: false
    };
  },
  computed: {
    ...mapStores(authStore, snackbarStore, socketStore)
  },
  watch: {
    item: {
      immediate: true,
      handler(): void {
        this.isFavorite = this.item.UserData?.IsFavorite || false;
      }
    },
    socket() {
      if (this.socket.messageData) {
        // @ts-expect-error - No typings for WebSocket messages
        const payloadData = this.socket.messageData.UserDataList;

        if (payloadData) {
          for (const payloadItem of payloadData) {
            if (payloadItem.ItemId === this.item.Id) {
              this.isFavorite = payloadItem.IsFavorite;
            }
          }
        }
      }
    }
  },
  methods: {
    async toggleFavorite(): Promise<void> {
      try {
        if (!this.item.Id) {
          throw new Error('Item has no Id');
        }

        if (!this.isFavorite) {
          this.isFavorite = true;

          await this.$api.userLibrary.markFavoriteItem({
            userId: this.auth.currentUserId,
            itemId: this.item.Id
          });
        } else {
          this.isFavorite = false;

          await this.$api.userLibrary.unmarkFavoriteItem({
            userId: this.auth.currentUserId,
            itemId: this.item.Id
          });
        }
      } catch {
        this.snackbar.push(this.$t('unableToToggleLike'), 'error');

        this.isFavorite = !this.isFavorite;
      }
    }
  }
});
</script>
