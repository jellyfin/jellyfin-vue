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
import { BaseItemDto, ItemFields } from '@jellyfin/sdk/lib/generated-client';
import IMdiPlaySpeed from 'virtual:icons/mdi/play-speed';
import IMdiArrowExpandUp from 'virtual:icons/mdi/arrow-expand-up';
import IMdiArrowExpandDown from 'virtual:icons/mdi/arrow-expand-down';
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
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/tv-shows-api';
import { useRemote, useSnackbar } from '@/composables';
import { canResume } from '@/utils/items';
import { playbackManagerStore, taskManagerStore } from '@/store';
import { TaskType } from '@/store/taskManager';
import { isEdgeUWP, isTv, isXbox, isPs4 } from '@/utils/browser-detection';
import downloadFiles from '@/utils/file-download';
import type { DownloadableFile } from '@/utils/file-download';
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
 * Check if the
 */
function canInstantMix(): boolean {
  const localItem =
    typeof menuProps.item.Id === 'string' &&
    menuProps.item.Id.indexOf('local') === 0;

  return (
    ['Audio', 'MusicAlbum', 'MusicArtist', 'MusicGenre'].includes(
      menuProps.item.Type || ''
    ) &&
    !localItem &&
    playbackManager.currentItem !== undefined
  );
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

  if (canInstantMix()) {
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
 * Create item download url
 */
function getItemDownloadObject(
  itemId: string,
  itemPath?: string
): DownloadableFile | undefined {
  const serverAddress = remote.sdk.api?.basePath;
  const userToken = remote.sdk.api?.accessToken;

  if (!serverAddress || !userToken) {
    return undefined;
  }

  const fileName = itemPath?.includes('\\')
    ? itemPath?.split('\\').pop()
    : itemPath?.split('/').pop();

  return {
    url: `${serverAddress}/Items/${itemId}/Download?api_key=${userToken}`,
    fileName: fileName || ''
  };
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
 * Get download URLs for seasons.
 */
async function getSeasonURLs(seasonId: string): Promise<DownloadableFile[]> {
  if (remote.sdk.api === undefined) {
    return [];
  }

  const episodes = (
    await remote.sdk.newUserApi(getItemsApi).getItems({
      userId: remote.auth.currentUserId,
      parentId: seasonId,
      fields: [ItemFields.Overview, ItemFields.CanDownload, ItemFields.Path]
    })
  ).data;

  return (
    episodes.Items?.map((r) => {
      if (r.Id && r.Path) {
        return getItemDownloadObject(r.Id, r.Path);
      }
    }).filter(
      (r): r is DownloadableFile =>
        r !== undefined && r.url.length > 0 && r.fileName.length > 0
    ) ?? []
  );
}

/**
 * Get download URLs for series.
 */
async function getSeasonURLsBySeries(
  seriesId: string
): Promise<DownloadableFile[]> {
  let mergedStreamURLs: DownloadableFile[] = [];

  if (remote.sdk.api === undefined) {
    return [];
  }

  const seasons = (
    await remote.sdk.newUserApi(getTvShowsApi).getSeasons({
      userId: remote.auth.currentUserId,
      seriesId: seriesId
    })
  ).data;

  for (const season of seasons.Items || []) {
    const seasonURLs = await getSeasonURLs(season.Id || '');

    mergedStreamURLs = [...mergedStreamURLs, ...seasonURLs];
  }

  return mergedStreamURLs;
}

/**
 * Download action for the currently selected item
 */
async function downloadAction(): Promise<void> {
  if (menuProps.item.Id && menuProps.item.Type && menuProps.item.Path) {
    let downloadURLs: DownloadableFile[] = [];

    switch (menuProps.item.Type) {
      case 'Season': {
        downloadURLs = await getSeasonURLs(menuProps.item.Id);
        break;
      }
      case 'Series': {
        downloadURLs = await getSeasonURLsBySeries(menuProps.item.Id);
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
  const collectionType = menuProps.item.CollectionType || '';

  if (collectionType === 'livetv') {
    return false;
  }

  const type = menuProps.item.Type || '';
  const status = menuProps.item.Status || '';

  const incompleteRecording = type === 'Recording' && status !== 'Completed';
  const localItem =
    typeof menuProps.item.Id === 'string' &&
    menuProps.item.Id.indexOf('local') === 0;

  const IsAdministrator =
    remote.auth.currentUser?.Policy?.IsAdministrator ?? false;

  return (
    IsAdministrator &&
    !localItem &&
    !incompleteRecording &&
    !invalidRefreshType.includes(type)
  );
}

/**
 * Library options for libraries
 */
function getLibraryOptions(): MenuOption[] {
  const libraryOptions: MenuOption[] = [];

  const validMediaDetailTypes = [
    'Audio',
    'AudioBook',
    'Book',
    'Episode',
    'Movie',
    'MusicVideo',
    'Photo',
    'Video',
    'Recording'
  ];

  if (validMediaDetailTypes.includes(menuProps.item.Type || '')) {
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
