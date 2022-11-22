<template>
  <v-btn
    v-if="canMarkWatched(item)"
    icon
    :dark="dark"
    @click.stop.prevent="togglePlayed">
    <v-icon :color="isPlayed ? 'primary' : ''">mdi-check</v-icon>
  </v-btn>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapStores } from 'pinia';
import { BaseItemDto } from '@jellyfin/client-axios';
import { authStore } from '~/store';
import { canMarkWatched } from '~/utils/items';
import { useSnackbar } from '@/composables';

export default defineComponent({
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
  setup() {
    return {
      useSnackbar
    };
  },
  data() {
    return {
      isPlayed: false
    };
  },
  computed: {
    ...mapStores(authStore)
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
      } catch {
        this.useSnackbar(this.$t('unableToTogglePlayed'), 'error');
        this.isPlayed = !this.isPlayed;
      }
    },
    canMarkWatched
  }
});
</script>
