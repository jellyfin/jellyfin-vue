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
          :icon="IMdiDotsHorizontal"
          :variant="outlined ? 'outlined' : undefined"
          v-bind="props"
          size="small"
          @click.stop.prevent="onActivatorClick"
          @contextmenu.stop.prevent="onRightClick" />
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
import IMdiPlaySpeed from 'virtual:icons/mdi/play-speed';
import IMdiArrowExpandUp from 'virtual:icons/mdi/arrow-expand-up';
import IMdiArrowExpandDown from 'virtual:icons/mdi/arrow-expand-down';
import IMdiPlaylistMinus from 'virtual:icons/mdi/playlist-minus';
import IMdiPlaylistPlus from 'virtual:icons/mdi/playlist-plus';
import IMdiPencilOutline from 'virtual:icons/mdi/pencil-outline';
import IMdiShuffle from 'virtual:icons/mdi/shuffle';
import IMdiReplay from 'virtual:icons/mdi/replay';
import IMdiRefresh from 'virtual:icons/mdi/refresh';
import IMdiDotsHorizontal from 'virtual:icons/mdi/dots-horizontal';
import { useRemote, useSnackbar } from '@/composables';
import { canResume } from '@/utils/items';
import { TaskType } from '@/store/taskManager';
import { playbackManagerStore, taskManagerStore } from '@/store';

type MenuOption = {
  title: string;
  icon: typeof IMdiPlaySpeed;
  action: () => void;
  disabled?: boolean;
};

const { t } = useI18n();
const remote = useRemote();

const menuProps = withDefaults(
  defineProps<{
    item: BaseItemDto;
    outlined?: boolean;
    zIndex?: number;
    rightClick?: boolean;
    queue?: boolean;
  }>(),
  {
    outlined: false,
    zIndex: 1000,
    rightClick: true,
    queue: false
  }
);

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

const playNextAction = {
  title: t('playback.playNext'),
  icon: IMdiPlaySpeed,
  action: (): void => {
    playbackManager.playNext(menuProps.item);
    useSnackbar(t('snackbar.playNext'), 'success');
  }
};

/**
 * Options to show when the item menu is invoked in a queue item
 */
function getQueueOptions(): MenuOption[] {
  const queueOptions: MenuOption[] = [];

  if (
    menuProps.queue &&
    playbackManager.queueIds.includes(menuProps.item.Id || '')
  ) {
    queueOptions.push({
      title: t('itemMenu.pushToTop'),
      icon: IMdiArrowExpandUp,
      action: (): void => {
        playbackManager.changeItemPosition(menuProps.item.Id, 0);
      }
    });

    if (playbackManager.currentItem?.Id !== menuProps.item.Id) {
      queueOptions.push({
        title: t('itemMenu.removeFromQueue'),
        icon: IMdiPlaylistMinus,
        action: (): void => {
          playbackManager.removeFromQueue(menuProps.item.Id || '');
        }
      });
    }

    if (
      playbackManager.nextItem?.Id !== menuProps.item.Id &&
      playbackManager.currentItem?.Id !== menuProps.item.Id
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

  return queueOptions;
}

/**
 * Playback options for the items
 */
function getPlaybackOptions(): MenuOption[] {
  const playbackOptions: MenuOption[] = [];

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

  if (playbackManager.currentItem) {
    if (
      playbackManager.nextItem?.Id !== menuProps.item.Id &&
      playbackManager.currentItem?.Id !== menuProps.item.Id &&
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

  return playbackOptions;
}

/**
 * Library options for libraries
 */
function getLibraryOptions(): MenuOption[] {
  const libraryOptions: MenuOption[] = [];

  if (
    remote.auth.currentUser?.Policy?.IsAdministrator &&
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
            if (!menuProps.item.Id) {
              throw new Error('Expected item to have id');
            }

            await getItemRefreshApi(remote.sdk.api).refreshItem({
              itemId: menuProps.item.Id,
              replaceAllImages: false,
              replaceAllMetadata: false
            });

            useSnackbar(t('libraryRefreshQueued'), 'normal');
            taskManager.startTask({
              type: TaskType.LibraryRefresh,
              id: menuProps.item.Id || '',
              data: menuProps.item.Name || '',
              progress: 0
            });
          } catch (error) {
            console.error(error);

            useSnackbar(t('unableToRefreshLibrary'), 'error');
          }
        }
      },
      disabled: isItemRefreshing.value
    });
  }

  if (remote.auth.currentUser?.Policy?.IsAdministrator) {
    libraryOptions.push({
      title: t('editMetadata'),
      icon: IMdiPencilOutline,
      action: (): void => {
        metadataDialog.value = true;
      }
    });
  }

  return libraryOptions;
}

const options = computed(() => {
  return [getQueueOptions(), getPlaybackOptions(), getLibraryOptions()];
});

/**
 * Right click handler for button or parent element
 */
function onRightClick(e: PointerEvent): void {
  e.stopPropagation();
  e.preventDefault();
  positionX.value = e.clientX;
  positionY.value = e.clientY;
  show.value = !show.value;
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
