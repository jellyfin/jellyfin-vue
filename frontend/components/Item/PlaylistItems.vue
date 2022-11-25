<template>
  <div>
    <h1 v-if="!children && !loading" class="text-h5 text-center">
      {{ $t('collectionEmpty') }}
    </h1>
    <skeleton-item-grid v-if="loading" :view-type="''" />

    <v-list v-if="!!children" color="transparent" two-line>
      <v-list-item-group class="list-group">
        <draggable
          class="list-draggable"
          v-bind="dragOptions"
          v-if="children.length > 0"
          v-model="children"
          :move="checkMove"
        >
          <v-hover
            v-for="(item, index) in children"
            :key="`${item.Id}-${index}`"
            v-slot="{ hover }"
          >
            <v-list-item ripple @click="playQueueFrom(index)">
              <v-list-item-action
                v-if="!hover"
                class="list-group-item d-flex justify-center d-flex transition"
                :class="{ 'primary--text font-weight-bold': isPlaying(item) }"
              >
                {{ index + 1 }}
              </v-list-item-action>
              <v-list-item-action v-else class="justify-center d-flex">
                <v-icon>mdi-drag-horizontal</v-icon>
              </v-list-item-action>
              <v-list-item-avatar tile class="list-group-item">
                <blurhash-image :item="item" />
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title
                  class="text-truncate ml-2 list-group-item transition"
                  :class="{
                    'primary--text font-weight-bold': isPlaying(item)
                  }"
                >
                  {{ item.Name }}
                </v-list-item-title>
                <v-list-item-subtitle
                  v-if="getArtists(item)"
                  class="ml-2 list-group-item transition"
                  :class="{
                    'primary--text font-weight-bold': isPlaying(item)
                  }"
                >
                  {{ getArtists(item) }}
                </v-list-item-subtitle>
              </v-list-item-content>

              <v-list-item-action>
                <like-button :item="item" />
              </v-list-item-action>
              <v-list-item-action class="mr-2">
                <item-menu :item="item" queue />
              </v-list-item-action>
            </v-list-item>
          </v-hover>
        </draggable>
        <div
          v-for="index in skeletonLength"
          v-else
          :key="index"
          class="d-flex align-center mt-5 mb-5"
        >
          <v-skeleton-loader type="avatar" class="ml-3 mr-3" />
          <v-skeleton-loader type="sentences" width="10em" class="pr-5" />
        </div>
      </v-list-item-group>
    </v-list>
  </div>
</template>

<script lang="ts">
import { BaseItemDto } from '@jellyfin/client-axios';
import Vue from 'vue';
import { mapStores } from 'pinia';
import { itemsStore, playbackManagerStore } from '~/store';

export default Vue.extend({
  props: {
    item: {
      type: Object as () => BaseItemDto,
      required: true
    }
  },
  methods: {
    checkMove(evt: any) {
      console.log(evt.draggedContext);
      this.newIndex = evt.draggedContext.futureIndex;
      this.oldIndex = evt.draggedContext.index;
    },
    getArtists(item: BaseItemDto): string | null {
      if (item.Artists) {
        return item.Artists.join(', ');
      } else {
        return null;
      }
    },
    isPlaying(item: BaseItemDto): boolean {
      if (this.playbackManager.getCurrentItem == undefined) {
        return false;
      }
      return item.Id == (this.playbackManager.getCurrentItem as BaseItemDto).Id;
    },
    playQueueFrom(playFromIndex: number): void {
      this.playbackManager
        .play({
          item: this.item,
          startFromIndex: playFromIndex,
          initiator: this.item
        })
        .then(() => this.items.fetchAndAddPlaylist(this.item.Id as string));
    }
  },
  data() {
    return {
      currentTab: 0,
      loading: false,
      newIndex: null as number | null,
      oldIndex: null as number | null,
      dragOptions: {
        animation: 500,
        delay: 0,
        group: false,
        dragoverBubble: true,
        ghostClass: 'ghost'
      }
    };
  },
  computed: {
    ...mapStores(itemsStore, playbackManagerStore),
    children: {
      get(): BaseItemDto[] {
        return this.items.getChildrenOfParentPlaylist(
          this.item.Id
        ) as BaseItemDto[];
      },
      set(newValue: BaseItemDto[]): void {
        if (this.oldIndex != null && this.newIndex != null) {
          this.loading = true;
          console.log(this.item);
          console.log(this.children[this.oldIndex]);
          console.log(this.newIndex);
          this.items
            .movePlaylistItem(
              this.item,
              this.children[this.oldIndex],
              this.newIndex
            )
            .then(() => (this.loading = false));
        }
        // this.items.addCollection(this.item, newValue);
        // setTimeout(() => (this.loading = false), 1000);
      }
    }
  },
  watch: {
    item: {
      immediate: true,
      async handler(item: BaseItemDto): Promise<void> {
        if (!this.children) {
          this.loading = true;
          await this.items.fetchAndAddPlaylist(item.Id as string);
          this.loading = false;
        }
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.list-draggable {
  user-select: none;
  min-height: 20px;
}
</style>
