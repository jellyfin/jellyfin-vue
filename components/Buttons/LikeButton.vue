<template>
  <v-btn :dark="dark" icon @click.stop.prevent="toggleFavorite">
    <v-icon :class="fav ? 'red--text' : ''">
      {{ fav ? 'mdi-heart' : 'mdi-heart-outline' }}
    </v-icon>
  </v-btn>
</template>

<script lang="ts">
import { BaseItemDto } from '@jellyfin/client-axios';
import Vue from 'vue';
import { mapActions } from 'vuex';

export default Vue.extend({
  props: {
    item: {
      type: Object as () => BaseItemDto,
      required: true
    },
    dark: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      fav: false
    };
  },
  watch: {
    item: {
      immediate: true,
      handler(): void {
        if (this.item.UserData?.IsFavorite) {
          this.fav = this.item.UserData.IsFavorite;
        }
      }
    }
  },
  mounted() {
    this.$store.subscribe((mutation) => {
      if (
        mutation?.type === 'SOCKET_ONMESSAGE' &&
        mutation?.payload?.MessageType === 'UserDataChanged'
      ) {
        const payloadData = mutation?.payload?.Data?.UserDataList;
        if (payloadData) {
          for (const it of payloadData) {
            if (it.ItemId === this.item.Id) {
              this.fav = it.IsFavorite;
            }
          }
        }
      }
    });
  },
  methods: {
    ...mapActions('snackbar', ['pushSnackbarMessage']),
    async toggleFavorite(): Promise<void> {
      if (this.item.Id) {
        try {
          if (!this.fav) {
            await this.$nuxt.$api.userLibrary.markFavoriteItem({
              userId: this.$auth.user.Id,
              itemId: this.item.Id
            });
            this.fav = true;
          } else {
            await this.$nuxt.$api.userLibrary.unmarkFavoriteItem({
              userId: this.$auth.user.Id,
              itemId: this.item.Id
            });
            this.fav = false;
          }
        } catch {
          this.pushSnackbarMessage({
            message: this.$t('unableToToggleLike'),
            color: 'error'
          });
          this.fav = !this.fav;
        }
      }
    }
  }
});
</script>
