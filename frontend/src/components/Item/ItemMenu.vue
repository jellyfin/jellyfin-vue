<template>
  <div v-if="options.length > 0">
    <v-fade-transition>
      <v-menu
        v-model="show"
        absolute
        :persistent="false"
        close-on-content-click
        :z-index="zIndex"
        :position-x="positionX"
        :position-y="positionY"
        location="top">
        <template #activator="{ on, attrs }">
          <v-btn
            icon
            :variant="outlined && 'outlined'"
            :dark="dark"
            v-bind="attrs"
            v-on="on"
            @click.stop.prevent="onActivatorClick"
            @contextmenu.stop.prevent="onRightClick">
            <Icon>
              <i-mdi-dots-horizontal />
            </Icon>
          </v-btn>
        </template>
        <v-list dense nav>
          <template v-for="(section, index1) in options">
            <v-divider
              v-if="section.length > 0 && index1 > 0"
              :key="`item-${item.Id}-section-${index1}-divider`"
              light />
            <v-list-item
              v-for="(menuOption, index2) in section"
              :key="`item-${item.Id}-section-${index1}-option-${index2}`"
              :disabled="menuOption.disabled"
              @click="menuOption.action">
              <v-icon :icon="menuOption.icon" />
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
      v-model:dialog="metadataDialog"
      :item-id="item.Id" />
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { getItemRefreshApi } from '@jellyfin/sdk/lib/utils/api/item-refresh-api';
import { playbackManagerStore, taskManagerStore } from '~/store';
import { TaskType, RunningTask } from '~/store/taskManager';
import { canResume } from '~/utils/items';
import { useRemote, useSnackbar } from '@/composables';
import IMdiPlaySpeed from '~icons/mdi/play-speed';
import IMdiArrowExpandUp from '~icons/mdi/arrow-expand-up';
import IMdiArrowExpandDown from '~icons/mdi/arrow-expand-down';
import IMdiPlaylistMinus from '~icons/mdi/playlist-minus';
import IMdiPlaylistPlus from '~icons/mdi/playlist-plus';
import IMdiPencilOutline from '~icons/mdi/pencil-outline';
import IMdiShuffle from '~icons/mdi/shuffle';
import IMdiReplay from '~icons/mdi/replay';
import IMdiRefresh from '~icons/mdi/refresh';

type MenuOption = {
  title: string;
  icon: typeof IMdiPlaySpeed;
  action: () => void;
  disabled?: boolean;
};

const { t } = useI18n();
const remote = useRemote();

const props = defineProps({
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
});

const parent = getCurrentInstance()?.parent;
const show = ref(false);
const positionX = ref<number | undefined>(undefined);
const positionY = ref<number | undefined>(undefined);
const metadataDialog = ref(false);
const playbackManager = playbackManagerStore();
const taskManager = taskManagerStore();
const isItemRefreshing = computed(
  () => taskManager.getTask(props.item.Id || '') !== undefined
);
const options = computed(() => {
  const menuOptions = [] as MenuOption[][];

  const playNextAction = {
    title: t('playback.playNext'),
    icon: IMdiPlaySpeed,
    action: (): void => {
      playbackManager.playNext(props.item);
      useSnackbar(t('snackbar.playNext'), 'success');
    }
  };

  /**
   * Queue options
   */
  const queueOptions = [] as MenuOption[];

  if (props.queue && playbackManager.queue.includes(props.item.Id || '')) {
    queueOptions.push({
      title: t('itemMenu.pushToTop'),
      icon: IMdiArrowExpandUp,
      action: (): void => {
        playbackManager.changeItemPosition(props.item.Id, 0);
      }
    });

    if (playbackManager.getCurrentItem?.Id !== props.item.Id) {
      queueOptions.push({
        title: t('itemMenu.removeFromQueue'),
        icon: IMdiPlaylistMinus,
        action: (): void => {
          playbackManager.removeFromQueue(props.item.Id || '');
        }
      });
    }

    if (
      playbackManager.getNextItem?.Id !== props.item.Id &&
      playbackManager.getCurrentItem?.Id !== props.item.Id
    ) {
      queueOptions.push(playNextAction);
    }

    queueOptions.push({
      title: t('itemMenu.pushToBottom'),
      icon: IMdiArrowExpandDown,
      action: (): void => {
        playbackManager.changeItemPosition(
          props.item.Id,
          playbackManager.queue.length - 1
        );
      }
    });
  }

  /**
   * Playback options
   */
  const playbackOptions = [] as MenuOption[];

  if (canResume(props.item)) {
    playbackOptions.push({
      title: t('playFromBeginning'),
      icon: IMdiReplay,
      action: (): void => {
        playbackManager.play({
          item: props.item
        });
      }
    });
  }

  playbackOptions.push({
    title: t('playback.shuffle'),
    icon: IMdiShuffle,
    action: (): void => {
      playbackManager.play({
        item: props.item,
        initiator: props.item,
        startShuffled: true
      });
    }
  });

  if (playbackManager.getCurrentItem) {
    if (
      playbackManager.getNextItem?.Id !== props.item.Id &&
      playbackManager.getCurrentItem?.Id !== props.item.Id &&
      !props.queue
    ) {
      playbackOptions.push(playNextAction);
    }

    playbackOptions.push({
      title: t('playback.addToQueue'),
      icon: IMdiPlaylistPlus,
      action: (): void => {
        playbackManager.addToQueue(props.item);
        useSnackbar(t('snackbar.addedToQueue'), 'success');
      }
    });
  }

  /**
   * Library options
   */
  const libraryOptions = [] as MenuOption[];

  if (
    remote.auth.currentUser.value?.Policy?.IsAdministrator &&
    ['Folder', 'CollectionFolder', 'UserView'].includes(props.item.Type || '')
  ) {
    libraryOptions.push({
      title: t('refreshLibrary'),
      icon: IMdiRefresh,
      action: async (): Promise<void> => {
        if (remote.sdk.api) {
          try {
            await getItemRefreshApi(remote.sdk.api).refreshItem({
              itemId: props.item.Id as string,
              replaceAllImages: false,
              replaceAllMetadata: false
            });

            useSnackbar(t('libraryRefreshQueued'), 'normal');
            taskManager.startTask({
              type: TaskType.LibraryRefresh,
              id: props.item.Id,
              data: props.item.Name,
              progress: 0
            } as RunningTask);
          } catch (error) {
            console.error(error);

            useSnackbar(t('unableToRefreshLibrary'), 'error');
          }
        }
      },
      disabled: isItemRefreshing.value
    });
  }

  if (remote.auth.currentUser.value?.Policy?.IsAdministrator) {
    libraryOptions.push({
      title: t('editMetadata'),
      icon: IMdiPencilOutline,
      action: (): void => {
        metadataDialog.value = true;
      }
    });
  }

  menuOptions.push(queueOptions, playbackOptions, libraryOptions);

  return menuOptions;
});

/**
 * Right click handler for button or parent element
 */
function onRightClick(e: PointerEvent): void {
  e.stopPropagation();
  e.preventDefault();
  positionX.value = e.clientX;
  positionY.value = e.clientY;
  show.value = true;
}

/**
 * Handle left click using the item menu button
 */
function onActivatorClick(): void {
  positionX.value = undefined;
  positionY.value = undefined;
}

onMounted(() => {
  const parentHtml = parent?.subTree.el as HTMLElement;

  if (parentHtml) {
    parentHtml.addEventListener(
      'contextmenu',
      // @ts-expect-error - Typings for contextmenu event are incorrect
      onRightClick
    );
  }
});

onUnmounted(() => {
  const parentHtml = parent?.subTree.el as HTMLElement;

  if (parentHtml) {
    parentHtml.removeEventListener(
      'contextmenu',
      // @ts-expect-error - Typings for contextmenu event are incorrect
      onRightClick
    );
  }
});
</script>

<style lang="scss" scoped>
.text {
  font-size: unset !important;
  line-height: unset !important;
}
</style>
