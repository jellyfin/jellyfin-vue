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
          <v-list-item
            v-for="(menuOption, index) in options"
            :key="`item-${item.Id}-menu-${index}`"
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
import { mapActions, mapGetters } from 'vuex';
import { BaseItemDto } from '@jellyfin/client-axios';
import itemHelper from '~/mixins/itemHelper';
import { RunningTask, TaskType } from '~/store/taskManager';

type MenuOption = {
  title: string;
  icon: string;
  action: () => void;
  disabled?: boolean;
};

export default Vue.extend({
  mixins: [itemHelper],
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
      default: 200
    },
    rightClick: {
      type: Boolean,
      default: true
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
    ...mapGetters('playbackManager', ['getCurrentItem']),
    /**
     * For some reason, mapGetters doesn't work at all with parametrized Vuex getters,
     * so we need to resort to this computed property.
     */
    isItemRefreshing(): boolean {
      const progress = this.$store.getters['taskManager/getTaskProgress'](
        this.item.Id
      );

      return progress !== undefined && progress >= 0 && progress < 100;
    },
    options: {
      get(): MenuOption[] {
        const menuOptions = [] as MenuOption[];

        if (this.canResume(this.item)) {
          menuOptions.push({
            title: this.$t('playFromBeginning'),
            icon: 'mdi-replay',
            action: () => {
              this.play({
                item: this.item
              });
            }
          });
        }

        menuOptions.push({
          title: this.$t('playback.shuffle'),
          icon: 'mdi-shuffle',
          action: () => {
            this.play({
              item: this.item,
              initiator: this.item,
              startShuffled: true
            });
          }
        });

        if (this.getCurrentItem) {
          menuOptions.push({
            title: this.$t('playback.playNext'),
            icon: 'mdi-play-speed',
            action: () => {
              this.playNext({
                item: this.item
              });
            }
          });

          menuOptions.push({
            title: this.$t('playback.addToQueue'),
            icon: 'mdi-playlist-plus',
            action: () => {
              this.addToQueue({
                item: this.item
              });
            }
          });
        }

        if (
          this.$auth.user?.Policy?.IsAdministrator &&
          ['Folder', 'CollectionFolder', 'UserView'].includes(
            this.item.Type || ''
          )
        ) {
          menuOptions.push({
            title: this.$t('refreshLibrary'),
            icon: 'mdi-refresh',
            action: async () => {
              try {
                await this.$api.itemRefresh.post({
                  itemId: this.item.Id as string,
                  replaceAllImages: false,
                  replaceAllMetadata: false
                });

                this.pushSnackbarMessage({
                  message: this.$t('libraryRefreshQueued'),
                  color: 'normal'
                });

                this.startTask({
                  type: TaskType.LibraryRefresh,
                  id: this.item.Id,
                  data: this.item.Name,
                  progress: 0
                } as RunningTask);
              } catch (e) {
                // eslint-disable-next-line no-console
                console.error(e);

                this.pushSnackbarMessage({
                  message: this.$t('unableToRefreshLibrary'),
                  color: 'error'
                });
              }
            },
            disabled: this.isItemRefreshing
          });
        }

        if (this.$auth.user?.Policy?.IsAdministrator) {
          menuOptions.push({
            title: this.$t('editMetadata'),
            icon: 'mdi-pencil-outline',
            action: () => {
              this.metadataDialog = true;
            }
          });
        }

        return menuOptions;
      }
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
    ...mapActions('snackbar', ['pushSnackbarMessage']),
    ...mapActions('playbackManager', ['play', 'playNext', 'addToQueue']),
    ...mapActions('taskManager', ['startTask']),
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
