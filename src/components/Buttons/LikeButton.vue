<template>
  <v-btn :dark="dark" icon @click.stop.prevent="toggleFavorite">
    <v-icon v-if="isFavorite">mdi-heart</v-icon>
    <v-icon v-else>mdi-heart-outline</v-icon>
  </v-btn>
</template>

<script lang="ts">
import { BaseItemDto } from '@jellyfin/client-axios';
import Vue, { PropType } from 'vue';
import { mapActions } from 'vuex';

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
    this.unsubscribe = this.$store.subscribe((mutation) => {
      if (
        mutation?.type === 'SOCKET_ONMESSAGE' &&
        mutation?.payload?.MessageType === 'UserDataChanged'
      ) {
        const payloadData = mutation?.payload?.Data?.UserDataList;

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
    ...mapActions('snackbar', ['pushSnackbarMessage']),
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
        this.pushSnackbarMessage({
          message: this.$t('unableToToggleLike'),
          color: 'error'
        });

        this.isFavorite = !this.isFavorite;
      }
    }
  }
});
</script>
