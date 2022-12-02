<template>
  <div v-if="options.length > 0">
    <v-menu
      v-model="show"
      :persistent="false"
      close-on-content-click
      :z-index="zIndex"
      :scroll-strategy="'close'"
      location="top">
      <template #activator="{ props }">
        <v-btn
          icon
          :variant="outlined ? 'outlined' : undefined"
          :dark="dark"
          v-bind="props"
          @click.stop.prevent="onActivatorClick"
          @contextmenu.stop.prevent="onRightClick">
          <Icon>
            <i-mdi-dots-horizontal />
          </Icon>
        </v-btn>
      </template>
      <v-list nav>
        <template v-for="(section, index1) in options">
          <v-divider
            v-if="section.length > 0 && index1 > 0"
            :key="`item-${item.Id}-section-${index1}-divider`" />
          <v-list-item
            v-for="(menuOption, index2) in section"
            :key="`item-${item.Id}-section-${index1}-option-${index2}`"
            class="text"
            :disabled="menuOption.disabled"
            :title="menuOption.title"
            :prepend-icon="menuOption.icon"
            @click="menuOption.action" />
        </template>
      </v-list>
    </v-menu>
    <metadata-editor-dialog
      v-if="metadataDialog"
      v-model:dialog="metadataDialog"
      :item-id="item.Id" />
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useEventListener } from '@vueuse/core';
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

const menuProps = defineProps({
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
  () => taskManager.getTask(menuProps.item.Id || '') !== undefined
);
const options = computed(() => {
  const menuOptions = [] as MenuOption[][];

  const playNextAction = {
    title: t('playback.playNext'),
    icon: IMdiPlaySpeed,
    action: (): void => {
      playbackManager.playNext(menuProps.item);
      useSnackbar(t('snackbar.playNext'), 'success');
    }
  };

  /**
   * Queue options
   */
  const queueOptions = [] as MenuOption[];

  if (
    menuProps.queue &&
    playbackManager.queue.includes(menuProps.item.Id || '')
  ) {
    queueOptions.push({
      title: t('itemMenu.pushToTop'),
      icon: IMdiArrowExpandUp,
      action: (): void => {
        playbackManager.changeItemPosition(menuProps.item.Id, 0);
      }
    });

    if (playbackManager.getCurrentItem?.Id !== menuProps.item.Id) {
      queueOptions.push({
        title: t('itemMenu.removeFromQueue'),
        icon: IMdiPlaylistMinus,
        action: (): void => {
          playbackManager.removeFromQueue(menuProps.item.Id || '');
        }
      });
    }

    if (
      playbackManager.getNextItem?.Id !== menuProps.item.Id &&
      playbackManager.getCurrentItem?.Id !== menuProps.item.Id
    ) {
      queueOptions.push(playNextAction);
    }

    queueOptions.push({
      title: t('itemMenu.pushToBottom'),
      icon: IMdiArrowExpandDown,
      action: (): void => {
        playbackManager.changeItemPosition(
          menuProps.item.Id,
          playbackManager.queue.length - 1
        );
      }
    });
  }

  /**
   * Playback options
   */
  const playbackOptions = [] as MenuOption[];

  if (canResume(menuProps.item)) {
    playbackOptions.push({
      title: t('playFromBeginning'),
      icon: IMdiReplay,
      action: (): void => {
        playbackManager.play({
          item: menuProps.item
        });
      }
    });
  }

  playbackOptions.push({
    title: t('playback.shuffle'),
    icon: IMdiShuffle,
    action: (): void => {
      playbackManager.play({
        item: menuProps.item,
        initiator: menuProps.item,
        startShuffled: true
      });
    }
  });

  if (playbackManager.getCurrentItem) {
    if (
      playbackManager.getNextItem?.Id !== menuProps.item.Id &&
      playbackManager.getCurrentItem?.Id !== menuProps.item.Id &&
      !menuProps.queue
    ) {
      playbackOptions.push(playNextAction);
    }

    playbackOptions.push({
      title: t('playback.addToQueue'),
      icon: IMdiPlaylistPlus,
      action: (): void => {
        playbackManager.addToQueue(menuProps.item);
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
    ['Folder', 'CollectionFolder', 'UserView'].includes(
      menuProps.item.Type || ''
    )
  ) {
    libraryOptions.push({
      title: t('refreshLibrary'),
      icon: IMdiRefresh,
      action: async (): Promise<void> => {
        if (remote.sdk.api) {
          try {
            await getItemRefreshApi(remote.sdk.api).refreshItem({
              itemId: menuProps.item.Id as string,
              replaceAllImages: false,
              replaceAllMetadata: false
            });

            useSnackbar(t('libraryRefreshQueued'), 'normal');
            taskManager.startTask({
              type: TaskType.LibraryRefresh,
              id: menuProps.item.Id,
              data: menuProps.item.Name,
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
    useEventListener(parentHtml, 'contextmenu', onRightClick);
  }
});
</script>

<style lang="scss" scoped>
.text {
  font-size: unset !important;
  line-height: unset !important;
}
</style>
