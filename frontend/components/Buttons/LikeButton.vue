<template>
  <v-btn :dark="dark" icon @click.stop.prevent="toggleFavorite">
    <v-icon v-if="isFavorite">mdi-heart</v-icon>
    <v-icon v-else>mdi-heart-outline</v-icon>
  </v-btn>
</template>

<script lang="ts">
import Vue from 'vue';
import { BaseItemDto } from '@jellyfin/client-axios';
import { mapStores } from 'pinia';
import { PropType } from 'vue';
import { snackbarStore } from '~/store';

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
      isFavorite: false,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      unsubscribe(): void {}
    };
  },
  watch: {
    item: {
      immediate: true,
      handler(): void {
        this.isFavorite = this.item.UserData?.IsFavorite || false;
      }
    }
  },
  mounted() {
    this.unsubscribe = this.$store.subscribe((mutation, state) => {
      if (
        mutation?.type === 'socket/ONMESSAGE' &&
        state.socket.messageType === 'UserDataChanged'
      ) {
        const payloadData = state.socket.messageData.UserDataList;

        if (payloadData) {
          for (const payloadItem of payloadData) {
            if (payloadItem.ItemId === this.item.Id) {
              this.isFavorite = payloadItem.IsFavorite;
            }
          }
        }
      }
    });
  },
  destroyed() {
    this.unsubscribe();
  },
  methods: {
    async toggleFavorite(): Promise<void> {
      if (!this.item.Id) {
        return;
      }

      try {
        if (!this.isFavorite) {
          this.isFavorite = true;

          await this.$api.userLibrary.markFavoriteItem({
            userId: this.$auth.user.Id,
            itemId: this.item.Id
          });
        } else {
          this.isFavorite = false;

          await this.$api.userLibrary.unmarkFavoriteItem({
            userId: this.$auth.user.Id,
            itemId: this.item.Id
          });
        }
      } catch {
        this.snackbar.push(this.$t('unableToToggleLike'), 'error');

        this.isFavorite = !this.isFavorite;
      }
    }
  },
  computed: {
    ...mapStores(snackbarStore)
  }
});
</script>
