<template>
  <div v-if="options.length > 0">
    <v-fade-transition>
      <v-menu
        v-model="show"
        absolute
        close-on-click
        close-on-content-click
        :z-index="zIndex"
        :position-x="positionX"
        :position-y="positionY"
        top
      >
        <template #activator="{ on, attrs }">
          <!-- See comments for this in the onRightClick method -->
          <v-btn
            icon
            :outlined="outlined"
            :dark="dark"
            v-bind="attrs"
            v-on="on"
            @click.stop.prevent="onActivatorClick"
            @contextmenu="onRightClick"
          >
            <v-icon>mdi-dots-horizontal</v-icon>
          </v-btn>
        </template>
        <v-list dense nav>
          <template v-for="(section, index1) in options">
            <v-divider
              v-if="section.length && index1 > 0"
              :key="`item-${item.Id}-section-${index1}-divider`"
              light
            />
            <v-list-item
              v-for="(menuOption, index2) in section"
              :key="`item-${item.Id}-section-${index1}-option-${index2}`"
              :disabled="menuOption.disabled"
              @click="menuOption.action"
            >
              <v-list-item-icon>
                <v-icon>{{ menuOption.icon }}</v-icon>
              </v-list-item-icon>
              <v-list-item-title class="text">
                {{ menuOption.title }}
              </v-list-item-title>
            </v-list-item>
          </template>
        </v-list>
      </v-menu>
    </v-fade-transition>
    <metadata-editor-dialog
      v-if="metadataDialog"
      :dialog.sync="metadataDialog"
      :item-id="item.Id"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapStores } from 'pinia';
import { BaseItemDto } from '@jellyfin/client-axios';
import {
  authStore,
  playbackManagerStore,
  snackbarStore,
  taskManagerStore
} from '~/store';
import { TaskType, RunningTask } from '~/store/taskManager';
import { canResume } from '~/utils/items';

type MenuOption = {
  title: string;
  icon: string;
  action: () => void;
  disabled?: boolean;
};

export default Vue.extend({
  props: {
    item: {
      type: Object as () => BaseItemDto,
      default: (): BaseItemDto => {
        return {};
      }
    },
    dark: {
      type: Boolean,
      default: false
    },
    outlined: {
      type: Boolean,
      default: false
    },
    zIndex: {
      type: Number,
      default: 1000
    },
    rightClick: {
      type: Boolean,
      default: true
    },
    queue: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      show: false,
      positionX: null as number | null,
      positionY: null as number | null,
      metadataDialog: false
    };
  },
  computed: {
    ...mapStores(
      authStore,
      snackbarStore,
      playbackManagerStore,
      taskManagerStore
    ),
    isItemRefreshing(): boolean {
      return this.taskManager.getTask(this.item.Id || '') !== undefined;
    },
    options(): MenuOption[][] {
      const menuOptions = [] as MenuOption[][];

      const playNextAction = {
        title: this.$t('playback.playNext'),
        icon: 'mdi-play-speed',
        action: (): void => {
          this.playbackManager.playNext(this.item);
          this.snackbar.push(this.$t('snackbar.playNext'), 'success');
        }
      };

      /**
       * Queue options
       */
      const queueOptions = [] as MenuOption[];

      if (
        this.queue &&
        this.playbackManager.queue.includes(this.item.Id || '')
      ) {
        queueOptions.push({
          title: this.$t('itemMenu.pushToTop'),
          icon: 'mdi-arrow-expand-up',
          action: (): void => {
            this.playbackManager.changeItemPosition(this.item.Id, 0);
          }
        });

        if (this.playbackManager.getCurrentItem?.Id !== this.item.Id) {
          queueOptions.push({
            title: this.$t('itemMenu.removeFromQueue'),
            icon: 'mdi-playlist-minus',
            action: (): void => {
              this.playbackManager.removeFromQueue(this.item.Id || '');
            }
          });
        }

        if (
          this.playbackManager.getNextItem?.Id !== this.item.Id &&
          this.playbackManager.getCurrentItem?.Id !== this.item.Id
        ) {
          queueOptions.push(playNextAction);
        }

        queueOptions.push({
          title: this.$t('itemMenu.pushToBottom'),
          icon: 'mdi-arrow-expand-down',
          action: (): void => {
            this.playbackManager.changeItemPosition(
              this.item.Id,
              this.playbackManager.queue.length - 1
            );
          }
        });
      }

      /**
       * Playback options
       */
      const playbackOptions = [] as MenuOption[];

      if (canResume(this.item)) {
        playbackOptions.push({
          title: this.$t('playFromBeginning'),
          icon: 'mdi-replay',
          action: (): void => {
            this.playbackManager.play({
              item: this.item
            });
          }
        });
      }

      playbackOptions.push({
        title: this.$t('playback.shuffle'),
        icon: 'mdi-shuffle',
        action: (): void => {
          this.playbackManager.play({
            item: this.item,
            initiator: this.item,
            startShuffled: true
          });
        }
      });

      if (this.playbackManager.getCurrentItem) {
        if (
          this.playbackManager.getNextItem?.Id !== this.item.Id &&
          this.playbackManager.getCurrentItem?.Id !== this.item.Id &&
          !this.queue
        ) {
          playbackOptions.push(playNextAction);
        }

        playbackOptions.push({
          title: this.$t('playback.addToQueue'),
          icon: 'mdi-playlist-plus',
          action: (): void => {
            this.playbackManager.addToQueue(this.item);
            this.snackbar.push(this.$t('snackbar.addedToQueue'), 'success');
          }
        });
      }

      /**
       * Library options
       */
      const libraryOptions = [] as MenuOption[];

      if (
        this.auth.currentUser?.Policy?.IsAdministrator &&
        ['Folder', 'CollectionFolder', 'UserView'].includes(
          this.item.Type || ''
        )
      ) {
        libraryOptions.push({
          title: this.$t('refreshLibrary'),
          icon: 'mdi-refresh',
          action: async (): Promise<void> => {
            try {
              await this.$api.itemRefresh.post({
                itemId: this.item.Id as string,
                replaceAllImages: false,
                replaceAllMetadata: false
              });

              this.snackbar.push(this.$t('libraryRefreshQueued'), 'normal');
              this.taskManager.startTask({
                type: TaskType.LibraryRefresh,
                id: this.item.Id,
                data: this.item.Name,
                progress: 0
              } as RunningTask);
            } catch (e) {
              // eslint-disable-next-line no-console
              console.error(e);

              this.snackbar.push(this.$t('unableToRefreshLibrary'), 'error');
            }
          },
          disabled: this.isItemRefreshing
        });
      }

      if (this.auth.currentUser?.Policy?.IsAdministrator) {
        libraryOptions.push({
          title: this.$t('editMetadata'),
          icon: 'mdi-pencil-outline',
          action: (): void => {
            this.metadataDialog = true;
          }
        });
      }

      menuOptions.push(queueOptions);
      menuOptions.push(playbackOptions);
      menuOptions.push(libraryOptions);

      return menuOptions;
    }
  },
  mounted() {
    if (this.rightClick && this.$parent.$el) {
      (this.$parent.$el as HTMLElement).addEventListener(
        'contextmenu',
        // @ts-expect-error - Typings for contextmenu event are incorrect
        this.onRightClick
      );
    }
  },
  destroyed() {
    if (this.$parent.$el) {
      (this.$parent.$el as HTMLElement).removeEventListener(
        'contextmenu',
        // @ts-expect-error - Typings for contextmenu event are incorrect
        this.onRightClick
      );
    }
  },
  methods: {
    onRightClick(e: PointerEvent): void {
      // Vue 2's API doesn't support native JavaScript events when the component's instances
      // are referenced using refs, only custom ones (generated using $emit): https://vuejs.org/v2/api/#vm-on
      // We get the parent's component instance using refs, so we need to add the event handler directly to
      // the DOM, not to the Vue instance (as done in the mounted() hook)
      //
      // We share this callback with the parent element and the v-btn Vue instance. This is why
      // we need to stopPropagation and preventDefault here, instead of using the @contextmenu.stop.prevent syntax.
      //
      // TODO: Revisit this on Vue 3, maybe this Vue API quirk is fixed
      e.stopPropagation();
      e.preventDefault();
      this.positionX = e.clientX;
      this.positionY = e.clientY;
      this.$nextTick(() => {
        this.show = true;
      });
    },
    onActivatorClick(): void {
      this.positionX = null;
      this.positionY = null;
    }
  }
});
</script>

<style lang="scss" scoped>
.text {
  font-size: unset !important;
  line-height: unset !important;
}
</style>
