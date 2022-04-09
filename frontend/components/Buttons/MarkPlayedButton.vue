<template>
  <v-btn
    v-if="canMarkWatched(item)"
    icon
    :dark="dark"
    @click.stop.prevent="togglePlayed"
  >
    <v-icon :color="isPlayed ? 'primary' : ''">mdi-check</v-icon>
  </v-btn>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapStores } from 'pinia';
import { BaseItemDto } from '@jellyfin/client-axios';
import itemHelper from '~/mixins/itemHelper';
import { authStore, snackbarStore } from '~/store';

export default Vue.extend({
  mixins: [itemHelper],
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
      isPlayed: false
    };
  },
  computed: {
    ...mapStores(authStore, snackbarStore)
  },
  watch: {
    item: {
      immediate: true,
      handler(): void {
        this.isPlayed = this.item.UserData?.Played || false;
      }
    }
  },
  created() {
    this.isPlayed = this.item.UserData?.Played || false;
  },
  methods: {
    async togglePlayed(): Promise<void> {
      try {
        if (!this.item.Id) {
          throw new Error('Item has no Id');
        }

        if (this.isPlayed) {
          this.isPlayed = false;
          await this.$api.playState.markUnplayedItem({
            userId: this.auth.currentUserId,
            itemId: this.item.Id
          });
        } else {
          this.isPlayed = true;
          await this.$api.playState.markPlayedItem({
            userId: this.auth.currentUserId,
            itemId: this.item.Id
          });
        }
      } catch (error) {
        this.snackbar.push(this.$t('unableToTogglePlayed'), 'error');
        this.isPlayed = !this.isPlayed;
      }
    }
  }
});
</script>
