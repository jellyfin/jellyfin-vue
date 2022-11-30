<template>
  <v-btn v-if="canMarkWatched(item)" icon @click.stop.prevent="togglePlayed">
    <Icon :color="isPlayed ? 'primary' : ''">
      <i-mdi-check />
    </Icon>
  </v-btn>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api';
import { canMarkWatched } from '~/utils/items';
import { useSnackbar } from '@/composables';

export default defineComponent({
  props: {
    item: {
      type: Object as () => BaseItemDto,
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
    async togglePlayed(): Promise<void> {
      try {
        if (!this.item.Id) {
          throw new Error('Item has no Id');
        }

        if (this.isPlayed) {
          this.isPlayed = false;
          await this.$remote.sdk.newUserApi(getPlaystateApi).markUnplayedItem({
            userId: this.$remote.auth.currentUserId.value || '',
            itemId: this.item.Id
          });
        } else {
          this.isPlayed = true;
          await this.$remote.sdk.newUserApi(getPlaystateApi).markPlayedItem({
            userId: this.$remote.auth.currentUserId.value || '',
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
