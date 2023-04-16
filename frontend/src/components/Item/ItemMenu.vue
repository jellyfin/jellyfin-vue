<template>
  <v-btn
    v-if="options.length > 0"
    :variant="outlined ? 'outlined' : undefined"
    icon
    size="small"
    @click.stop.prevent="onActivatorClick"
    @contextmenu.stop.prevent="onRightClick">
    <v-icon>
      <i-mdi-dots-vertical />
    </v-icon>
    <v-menu
      v-model="show"
      :persistent="false"
      close-on-content-click
      close-on-back
      :z-index="zIndex"
      scroll-strategy="close"
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
    v-if="metadataDialog && item.Id"
    :item-id="item.Id"
    @close="metadataDialog = false" />
  <refresh-metadata-dialog
    v-if="refreshDialog && item.Id"
    :item="menuProps.item"
    @close="refreshDialog = false" />
  <identify-dialog
    v-if="identifyItemDialog && item.Id"
    :item="menuProps.item"
    @close="identifyItemDialog = false" />
  <media-detail-dialog
    v-if="mediaInfoDialog && item.Id"
    :item="menuProps.item"
    @close="mediaInfoDialog = false" />
</template>

<script lang="ts">
import { computed, getCurrentInstance, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
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
import IMdiInformation from 'virtual:icons/mdi/information';
import IMdiPlaylistMinus from 'virtual:icons/mdi/playlist-minus';
import IMdiPlaylistPlus from 'virtual:icons/mdi/playlist-plus';
import IMdiPencilOutline from 'virtual:icons/mdi/pencil-outline';
import IMdiShuffle from 'virtual:icons/mdi/shuffle';
import IMdiReplay from 'virtual:icons/mdi/replay';
import IMdiRefresh from 'virtual:icons/mdi/refresh';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { useRoute, useRouter } from 'vue-router';
import { v4 } from 'uuid';
import { useRemote, useSnackbar, useConfirmDialog } from '@/composables';
import {
  canIdentify,
  canInstantMix,
  canRefreshMetadata,
  canResume,
  getItemDownloadObject,
  getItemSeasonDownloadObjects,
  getItemSeriesDownloadObjects
} from '@/utils/items';
import { playbackManagerStore, taskManagerStore } from '@/store';
import {
  DownloadableFile,
  canBrowserDownloadItem,
  downloadFiles
} from '@/utils/file-download';
import { useClipboardWrite } from '@/composables/use-clipboard';

type MenuOption = {
  title: string;
  icon: typeof IMdiPlaySpeed;
  action: () => void;
  disabled?: boolean;
};

/**
 * SHARED STATE ACROSS ALL THE COMPONENT INSTANCES
 */
const openMenu = ref<string>();
</script>

<script setup lang="ts">
const { t } = useI18n();
const instanceId = v4();
const remote = useRemote();
const router = useRouter();
const route = useRoute();

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
/**
 * Ensure only one item menu is always open at a time, regardless if there are duplicated ones in
 * the same screen
 */
const show = computed({
  get() {
    return instanceId === openMenu.value;
  },
  set(newVal: boolean) {
    openMenu.value = newVal ? instanceId : undefined;
  }
});
const positionX = ref<number | undefined>(undefined);
const positionY = ref<number | undefined>(undefined);
const metadataDialog = ref(false);
const refreshDialog = ref(false);
const identifyItemDialog = ref(false);
const mediaInfoDialog = ref(false);
const playbackManager = playbackManagerStore();
const taskManager = taskManagerStore();
const errorMessage = t('errors.anErrorHappened');
const isItemRefreshing = computed(
  () => taskManager.getTask(menuProps.item.Id || '') !== undefined
);

/**
 * == ACTIONS ==
 */
/**
 * Playback related actions
 */
const playNextAction = {
  title: t('playback.playNext'),
  icon: IMdiPlaySpeed,
  action: async (): Promise<void> => {
    await playbackManager.playNext(menuProps.item);
    useSnackbar(t('snackbar.playNext'), 'success');
  }
};
const pushToTopOfQueueAction = {
  title: t('itemMenu.pushToTop'),
  icon: IMdiArrowExpandUp,
  action: (): void => {
    playbackManager.changeItemPosition(menuProps.item.Id, 0);
  }
};
const removeFromQueueAction = {
  title: t('itemMenu.removeFromQueue'),
  icon: IMdiPlaylistMinus,
  action: (): void => {
    playbackManager.removeFromQueue(menuProps.item.Id || '');
  }
};
const pushToBottomOfQueueAction = {
  title: t('itemMenu.pushToBottom'),
  icon: IMdiArrowExpandDown,
  action: (): void => {
    playbackManager.changeItemPosition(
      menuProps.item.Id,
      playbackManager.queue.length - 1
    );
  }
};
const playFromBeginningAction = {
  title: t('playFromBeginning'),
  icon: IMdiReplay,
  action: async (): Promise<void> => {
    await playbackManager.play({
      item: menuProps.item
    });
  }
};
const shuffleAction = {
  title: t('playback.shuffle'),
  icon: IMdiShuffle,
  action: async (): Promise<void> => {
    await playbackManager.play({
      item: menuProps.item,
      initiator: menuProps.item,
      startShuffled: true
    });
  }
};
const addToQueueAction = {
  title: t('playback.addToQueue'),
  icon: IMdiPlaylistPlus,
  action: async (): Promise<void> => {
    await playbackManager.addToQueue(menuProps.item);
    useSnackbar(t('snackbar.addedToQueue'), 'success');
  }
};
const instantMixAction = {
  title: t('instantMix'),
  icon: IMdiDisc,
  action: async (): Promise<void> => {
    if (menuProps.item.Id) {
      try {
        await playbackManager.instantMixFromItem(menuProps.item.Id);
        useSnackbar(t('instantMixQueued'), 'success');
      } catch {
        useSnackbar(errorMessage, 'error');
      }
    }
  }
};
/**
 * Item related actions
 */
const mediaInfoAction = {
  title: t('mediaInfo'),
  icon: IMdiInformation,
  action: (): void => {
    mediaInfoDialog.value = true;
  }
};
const refreshAction = {
  title: t('refreshMetadata'),
  icon: IMdiRefresh,
  action: (): void => {
    refreshDialog.value = true;
  },
  disabled: isItemRefreshing.value
};
const editMetadataAction = {
  title: t('editMetadata'),
  icon: IMdiPencilOutline,
  action: (): void => {
    metadataDialog.value = true;
  }
};
const deleteItemAction = {
  title: t('deleteItem'),
  icon: IMdiDelete,
  action: async (): Promise<void> => {
    await useConfirmDialog(
      async () => {
        if (!menuProps.item.Id) {
          return;
        }

        try {
          await remote.sdk.newUserApi(getLibraryApi).deleteItem({
            itemId: menuProps.item.Id
          });

          if (route.fullPath.includes(menuProps.item.Id)) {
            await router.replace('/');
          }
        } catch (error) {
          console.error(error);

          useSnackbar(errorMessage, 'error');
        }
      },
      {
        title: t('deleteItem'),
        text: t('deleteItemDescription'),
        confirmText: t('delete')
      }
    );
  }
};
const identifyItemAction = {
  title: t('identify'),
  icon: IMdiCloudSearch,
  action: (): void => {
    identifyItemDialog.value = true;
  }
};
const sharedDownloadAction = async (): Promise<void> => {
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
      try {
        await downloadFiles(downloadURLs);
      } catch (error) {
        console.error(error);

        useSnackbar(errorMessage, 'error');
      }
    } else {
      console.error(
        'Unable to get download URL for selected item/series/season'
      );
      useSnackbar(errorMessage, 'error');
    }
  }
};
const singleDownloadAction = {
  title: t('downloadItem', 1),
  icon: IMdiDownload,
  action: sharedDownloadAction
};
const multiDownloadAction = {
  title: t('downloadItem', 2),
  icon: IMdiDownloadMultiple,
  action: sharedDownloadAction
};
const copyStreamURLAction = {
  title: t('copyStreamURL'),
  icon: IMdiContentCopy,
  action: async (): Promise<void> => {
    if (menuProps.item.Id) {
      const downloadHref = getItemDownloadObject(menuProps.item.Id);

      if (downloadHref?.url) {
        await useClipboardWrite(downloadHref.url);
      } else {
        console.error('Unable to get stream URL for selected item');
        useSnackbar(errorMessage, 'error');
      }
    }
  }
};
/**
 * == END OF ACTIONS ==
 */

/**
 * Options to show when the item menu is invoked in a queue item
 */
function getQueueOptions(): MenuOption[] {
  const queueOptions: MenuOption[] = [];

  if (
    menuProps.queue &&
    playbackManager.queueIds.includes(menuProps.item.Id || '')
  ) {
    queueOptions.push(pushToTopOfQueueAction);

    if (playbackManager.currentItem?.Id !== menuProps.item.Id) {
      queueOptions.push(removeFromQueueAction);
    }

    if (
      playbackManager.nextItem?.Id !== menuProps.item.Id &&
      playbackManager.currentItem?.Id !== menuProps.item.Id
    ) {
      queueOptions.push(playNextAction);
    }

    queueOptions.push(pushToBottomOfQueueAction);
  }

  return queueOptions;
}

/**
 * Playback options for the items
 */
function getPlaybackOptions(): MenuOption[] {
  const playbackOptions: MenuOption[] = [];

  if (canResume(menuProps.item)) {
    playbackOptions.push(playFromBeginningAction);
  }

  playbackOptions.push(shuffleAction);

  if (playbackManager.currentItem) {
    if (
      playbackManager.nextItem?.Id !== menuProps.item.Id &&
      playbackManager.currentItem?.Id !== menuProps.item.Id &&
      !menuProps.queue
    ) {
      playbackOptions.push(playNextAction);
    }

    playbackOptions.push(addToQueueAction);
  }

  if (canInstantMix(menuProps.item) && playbackManager.currentItem) {
    playbackOptions.push(instantMixAction);
  }

  return playbackOptions;
}

/**
 * Copy and download action for the current selected item
 */
function getCopyDownloadOptions(): MenuOption[] {
  const copyDownloadActions: MenuOption[] = [];

  if (menuProps.item.CanDownload) {
    copyDownloadActions.push(copyStreamURLAction);

    if (canBrowserDownloadItem(menuProps.item)) {
      copyDownloadActions.push(singleDownloadAction);

      if (['Season', 'Series'].includes(menuProps.item.Type || '')) {
        copyDownloadActions.push(multiDownloadAction);
      }
    }
  }

  return copyDownloadActions;
}

/**
 * Library options for libraries
 */
function getLibraryOptions(): MenuOption[] {
  const libraryOptions: MenuOption[] = [];

  if (menuProps.item.MediaSources) {
    libraryOptions.push(mediaInfoAction);
  }

  if (canRefreshMetadata(menuProps.item)) {
    libraryOptions.push(refreshAction);
  }

  if (remote.auth.currentUser?.Policy?.IsAdministrator) {
    libraryOptions.push(editMetadataAction);

    if (canIdentify(menuProps.item)) {
      libraryOptions.push(identifyItemAction);
    }
  }

  if (menuProps.item.CanDelete) {
    libraryOptions.push(deleteItemAction);
  }

  return libraryOptions;
}

const options = computed(() => {
  return [
    getQueueOptions(),
    getPlaybackOptions(),
    getCopyDownloadOptions(),
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
