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
import { mapActions } from 'vuex';
import { BaseItemDto } from '@jellyfin/client-axios';
import itemHelper from '~/mixins/itemHelper';

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
    ...mapActions('snackbar', ['pushSnackbarMessage']),
    async togglePlayed(): Promise<void> {
      try {
        if (this.isPlayed) {
          this.isPlayed = false;
          await this.$api.playState.markUnplayedItem({
            userId: this.$auth.user.Id,
            itemId: this.item.Id || ''
          });
        } else {
          this.isPlayed = true;
          await this.$api.playState.markPlayedItem({
            userId: this.$auth.user.Id,
            itemId: this.item.Id || ''
          });
        }
      } catch (error) {
        this.pushSnackbarMessage({
          message: this.$t('unableToTogglePlayed'),
          color: 'error'
        });
        this.isPlayed = !this.isPlayed;
      }
    }
  }
});
</script>
