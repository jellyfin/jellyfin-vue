<template>
  <v-btn
    v-if="options.length > 0"
    :variant="outlined ? 'outlined' : undefined"
    size="small"
    @click.stop.prevent="onActivatorClick"
    @contextmenu.stop.prevent="onRightClick">
    <v-icon>
      <i-mdi-dots-horizontal />
    </v-icon>
    <v-menu
      v-model="show"
      :persistent="false"
      close-on-content-click
      :z-index="zIndex"
      :scroll-strategy="'close'"
      location="top">
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
  </v-btn>
  <metadata-editor-dialog
    v-if="item.Id"
    v-model:dialog="metadataDialog"
    :item-id="item.Id" />
  <refresh-metadata-dialog
    v-if="item.Id"
    v-model:dialog="refreshDialog"
    :item-id="item.Id"
    @on-refresh="onRefreshExecuted" />
  <media-detail-dialog
    v-if="item.Id"
    v-model:dialog="mediaInfoDialog"
    :item-id="item.Id" />
  <identify-dialog
    v-if="item.Id"
    v-model:dialog="identifyItemDialog"
    :item-id="item.Id" />
  <confirm-dialog
    v-if="item.Id"
    v-model:dialog="deleteDialog"
    :title="t('deleteItem')"
    :text="t('deleteItemDescription')"
    :confirm-text="t('delete')"
    @on-confirm="onDeleteConfirmed" />
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useEventListener } from '@vueuse/core';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import IMdiPlaySpeed from 'virtual:icons/mdi/play-speed';
import IMdiArrowExpandUp from 'virtual:icons/mdi/arrow-expand-up';
import IMdiArrowExpandDown from 'virtual:icons/mdi/arrow-expand-down';
import IMdiCloudSearch from 'virtual:icons/mdi/cloud-search-outline';
import IMdiContentCopy from 'virtual:icons/mdi/content-copy';
import IMdiDelete from 'virtual:icons/mdi/delete';
import IMdiDisc from 'virtual:icons/mdi/disc';
import IMdiDownload from 'virtual:icons/mdi/download';
import IMdiDownloadMultiple from 'virtual:icons/mdi/download-multiple';
import IMdiPlaylistMinus from 'virtual:icons/mdi/playlist-minus';
import IMdiPlaylistPlus from 'virtual:icons/mdi/playlist-plus';
import IMdiPencilOutline from 'virtual:icons/mdi/pencil-outline';
import IMdiInformation from 'virtual:icons/mdi/information';
import IMdiShuffle from 'virtual:icons/mdi/shuffle';
import IMdiReplay from 'virtual:icons/mdi/replay';
import IMdiRefresh from 'virtual:icons/mdi/refresh';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { useRemote, useSnackbar } from '@/composables';
import {
  canIdentify,
  canInstantMix,
  canResume,
  getItemSeriesDownloadObjects,
  getItemSeasonDownloadObjects,
  getItemDownloadObject,
  isLocalItem
} from '@/utils/items';
import { playbackManagerStore, taskManagerStore } from '@/store';
import { TaskType } from '@/store/taskManager';
import { isEdgeUWP, isTv, isXbox, isPs4 } from '@/utils/browser-detection';
import downloadFiles, { DownloadableFile } from '@/utils/file-download';
import { writeToClipboard } from '@/utils/clipboard';

type MenuOption = {
  title: string;
  icon: typeof IMdiPlaySpeed;
  action: () => void;
  disabled?: boolean;
};

const { t } = useI18n();
const remote = useRemote();
const router = useRouter();

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
const mediaInfoDialog = ref(false);
const metadataDialog = ref(false);
const refreshDialog = ref(false);
const deleteDialog = ref(false);
const identifyItemDialog = ref(false);
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

  if (canInstantMix(menuProps.item) && playbackManager.currentItem) {
    playbackOptions.push({
      title: t('playback.instantMix'),
      icon: IMdiDisc,
      action: async (): Promise<void> => {
        if (menuProps.item.Id) {
          try {
            await playbackManager.instantMixFromItem(menuProps.item.Id);
            useSnackbar(t('snackbar.instantMixQueued'), 'success');
          } catch {
            useSnackbar(t('snackbar.instantMixFailed'), 'error');
          }
        }
      }
    });
  }

  return playbackOptions;
}

/**
 * Check if the browser can download the item
 */
function browserCanDownload(): boolean {
  return (
    !isEdgeUWP() &&
    !isTv() &&
    !isXbox() &&
    !isPs4() &&
    menuProps.item.Type !== 'Book'
  );
}

/**
 * Download action for the currently selected item
 */
async function downloadAction(): Promise<void> {
  if (menuProps.item.Id && menuProps.item.Type && menuProps.item.Path) {
    let downloadURLs: DownloadableFile[] = [];

    switch (menuProps.item.Type) {
      case 'Season': {
        downloadURLs = await getItemSeasonDownloadObjects(menuProps.item.Id);
        break;
      }
      case 'Series': {
        downloadURLs = await getItemSeriesDownloadObjects(menuProps.item.Id);
        break;
      }
      default: {
        const url = getItemDownloadObject(
          menuProps.item.Id,
          menuProps.item.Path
        );

        if (url) {
          downloadURLs = [url];
        }

        break;
      }
    }

    if (downloadURLs) {
      await downloadFiles(downloadURLs);
    } else {
      useSnackbar(t('failedToGetDownloadUrl'), 'error');
    }
  }
}

/**
 * Copy action for the current selected item
 */
function getCopyDownloadActions(): MenuOption[] {
  const copyDownloadActions: MenuOption[] = [];

  if (menuProps.item.CanDownload) {
    copyDownloadActions.push({
      title: t('download.copyStreamUrl'),
      icon: IMdiContentCopy,
      action: async (): Promise<void> => {
        if (menuProps.item.Id) {
          const downloadHref = getItemDownloadObject(menuProps.item.Id);

          if (downloadHref) {
            await copy(downloadHref.url);
          } else {
            useSnackbar(t('failedToGetDownloadUrl'), 'error');
          }
        }
      }
    });

    if (browserCanDownload()) {
      copyDownloadActions.push({
        title: t('download.download'),
        icon: IMdiDownload,
        action: downloadAction
      });

      if (['Season', 'Series'].includes(menuProps.item.Type || '')) {
        copyDownloadActions.push({
          title: t('download.downloadAll'),
          icon: IMdiDownloadMultiple,
          action: downloadAction
        });
      }
    }
  }

  return copyDownloadActions;
}

/**
 * Check if the item and user can refresh the library/metadata.
 */
function canRefreshLibrary(): boolean {
  const invalidRefreshType = ['Timer', 'SeriesTimer', 'Program', 'TvChannel'];

  if (menuProps.item.CollectionType === 'livetv') {
    return false;
  }

  const incompleteRecording =
    menuProps.item.Type === 'Recording' &&
    menuProps.item.Status !== 'Completed';

  const IsAdministrator =
    remote.auth.currentUser?.Policy?.IsAdministrator ?? false;

  return (
    IsAdministrator &&
    !isLocalItem(menuProps.item) &&
    !incompleteRecording &&
    !invalidRefreshType.includes(menuProps.item.Type || '')
  );
}

/**
 * Library options for libraries
 */
function getLibraryOptions(): MenuOption[] {
  const libraryOptions: MenuOption[] = [];

  if (menuProps.item.MediaSources) {
    libraryOptions.push({
      title: t('mediaInfo.title'),
      icon: IMdiInformation,
      action: (): void => {
        mediaInfoDialog.value = true;
      }
    });
  }

  if (canRefreshLibrary()) {
    const isLibrary = ['Folder', 'CollectionFolder', 'UserView'].includes(
      menuProps.item.Type || ''
    );

    // XXX: Maybe just merge it together?
    const title = isLibrary ? t('refreshLibrary') : t('metadata.refresh.title');

    libraryOptions.push({
      title: title,
      icon: IMdiRefresh,
      action: async (): Promise<void> => {
        refreshDialog.value = true;
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

    if (canIdentify(menuProps.item)) {
      libraryOptions.push({
        title: t('identify.title'),
        icon: IMdiCloudSearch,
        action: (): void => {
          identifyItemDialog.value = true;
        }
      });
    }
  }

  if (menuProps.item.CanDelete) {
    libraryOptions.push({
      title: t('deleteItem'),
      icon: IMdiDelete,
      action: (): void => {
        deleteDialog.value = true;
      }
    });
  }

  return libraryOptions;
}

const options = computed(() => {
  return [
    getQueueOptions(),
    getPlaybackOptions(),
    getCopyDownloadActions(),
    getLibraryOptions()
  ];
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

/**
 * Handle when the refresh task is executed
 */
function onRefreshExecuted(): void {
  const isLibrary = ['Folder', 'CollectionFolder', 'UserView'].includes(
    menuProps.item.Type || ''
  );

  if (isLibrary) {
    taskManager.startTask({
      type: TaskType.LibraryRefresh,
      id: menuProps.item.Id || '',
      data: menuProps.item.Name || 'ID ' + menuProps.item.Id,
      progress: 0
    });
  }
}

/**
 * Handle deletion of the item
 */
async function onDeleteConfirmed(): Promise<void> {
  if (!menuProps.item.Id) {
    useSnackbar(t('failedToDeleteItem'), 'error');

    return;
  }

  try {
    await remote.sdk.newUserApi(getLibraryApi).deleteItem({
      itemId: menuProps.item.Id
    });
    router.replace('/');
  } catch {
    // failure
    useSnackbar(t('failedToDeleteItem'), 'error');
  }
}

const copy = async (text: string): Promise<void> => {
  try {
    await writeToClipboard(text);
    useSnackbar(t('clipboardSuccess'), 'success');
  } catch {
    useSnackbar(t('clipboardFail'), 'error');
  }
};

onMounted(() => {
  const parentHtml = parent?.subTree.el;

  if (parentHtml instanceof HTMLElement) {
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
