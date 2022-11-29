<template>
  <v-btn icon @click.stop.prevent="toggleFavorite">
    <Icon v-if="isFavorite">
      <i-mdi-heart />
    </Icon>
    <Icon v-else>
      <i-mdi-heart-outline />
    </Icon>
  </v-btn>
</template>

<script lang="ts">
import { PropType, defineComponent } from 'vue';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { useSnackbar } from '@/composables';

export default defineComponent({
  props: {
    item: {
      type: Object as PropType<BaseItemDto>,
      required: true
    }
  },
  setup() {
    return {
      useSnackbar
    };
  },
  data() {
    return {
      isFavorite: false
    };
  },
  watch: {
    item: {
      immediate: true,
      handler(): void {
        this.isFavorite = this.item.UserData?.IsFavorite || false;
      }
    },
    '$remote.socket.message'() {
      if (this.$remote.socket.messageData.value) {
        const payloadData = this.$remote.socket.messageData.value.UserDataList;

        if (payloadData) {
          // @ts-expect-error - No typings for WebSocket messages
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
            userId: this.$remote.auth.currentUserId.value,
            itemId: this.item.Id
          });
        } else {
          this.isFavorite = false;

          await this.$api.userLibrary.unmarkFavoriteItem({
            userId: this.$remote.auth.currentUserId.value,
            itemId: this.item.Id
          });
        }
      } catch {
        this.useSnackbar(this.$t('unableToToggleLike'), 'error');

        this.isFavorite = !this.isFavorite;
      }
    }
  }
});
</script>
