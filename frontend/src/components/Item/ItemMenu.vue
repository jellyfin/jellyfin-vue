<template>
  <VBtn
    v-if="options.length"
    :variant="outlined ? 'outlined' : undefined"
    icon
    size="small"
    @click.stop.prevent="onActivatorClick"
    @contextmenu.stop.prevent="onRightClick">
    <VIcon>
      <IMdiDotsVertical />
    </VIcon>
    <VMenu
      v-model="show"
      :persistent="false"
      close-on-content-click
      close-on-back
      :z-index="zIndex"
      scroll-strategy="close"
      location="top">
      <VList nav>
        <template v-for="(section, index1) in options">
          <VDivider
            v-if="section.length && index1 > 0"
            :key="`item-${item.Id}-section-${index1}-divider`" />
          <VListItem
            v-for="(menuOption, index2) in section"
            :key="`item-${item.Id}-section-${index1}-option-${index2}`"
            class="text"
            :disabled="menuOption.disabled"
            :title="menuOption.title"
            :prepend-icon="menuOption.icon"
            @click="menuOption.action" />
        </template>
      </VList>
    </VMenu>
  </VBtn>
  <MetadataEditorDialog
    v-if="metadataDialog && itemId"
    :item-id="itemId"
    @close="metadataDialog = false" />
  <RefreshMetadataDialog
    v-if="refreshDialog && item.Id"
    :item="item"
    @close="refreshDialog = false" />
  <IdentifyDialog
    v-if="identifyItemDialog && item.Id"
    :item="item"
    @close="identifyItemDialog = false" />
  <MediaDetailDialog
    v-if="mediaInfoDialog && item.Id"
    :item="item"
    :media-source-index="mediaSourceIndex"
    @close="mediaInfoDialog = false" />
</template>

<script lang="ts">
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { useClipboard, useEventListener } from '@vueuse/core';
import IMdiArrowExpandDown from 'virtual:icons/mdi/arrow-expand-down';
import IMdiArrowExpandUp from 'virtual:icons/mdi/arrow-expand-up';
import IMdiCloudSearch from 'virtual:icons/mdi/cloud-search-outline';
import IMdiContentCopy from 'virtual:icons/mdi/content-copy';
import IMdiDelete from 'virtual:icons/mdi/delete';
import IMdiDisc from 'virtual:icons/mdi/disc';
import IMdiInformation from 'virtual:icons/mdi/information';
import IMdiPencilOutline from 'virtual:icons/mdi/pencil-outline';
import IMdiPlaySpeed from 'virtual:icons/mdi/play-speed';
import IMdiPlaylistMinus from 'virtual:icons/mdi/playlist-minus';
import IMdiPlaylistPlus from 'virtual:icons/mdi/playlist-plus';
import IMdiRefresh from 'virtual:icons/mdi/refresh';
import IMdiReplay from 'virtual:icons/mdi/replay';
import IMdiShuffle from 'virtual:icons/mdi/shuffle';
import { computed, getCurrentInstance, onMounted, shallowRef, useId, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { isStr } from '@/utils/validation';
import {
  canIdentify,
  canInstantMix,
  canRefreshMetadata,
  canResume,
  getItemDownloadUrl,
  getItemIdFromSourceIndex,
  getItemSeasonDownloadMap,
  getItemSeriesDownloadMap
} from '@/utils/items';
import { taskManager } from '@/store/task-manager';
import { playbackManager } from '@/store/playback-manager';
import { apiStore } from '@/store/api';
import { remote } from '@/plugins/remote';
import { useSnackbar } from '@/composables/use-snackbar';
import { useConfirmDialog } from '@/composables/use-confirm-dialog';

interface MenuOption {
  title: string;
  icon: typeof IMdiPlaySpeed;
  action: () => void;
  disabled?: boolean;
}

/**
 * SHARED STATE ACROSS ALL THE COMPONENT INSTANCES
 */
const openMenu = shallowRef<string>();
</script>

<script setup lang="ts">
const { item, outlined, zIndex = 1000, queue, mediaSourceIndex } = defineProps<{
  item: BaseItemDto;
  outlined?: boolean;
  zIndex?: number;
  queue?: boolean;
  mediaSourceIndex?: number;
}>();

const emit = defineEmits<{
  active: [];
  inactive: [];
}>();

const { t } = useI18n();
const instanceId = useId();
const router = useRouter();
const route = useRoute();

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

const itemId = computed(
  () => getItemIdFromSourceIndex(
    item, mediaSourceIndex
  )
);
const positionX = shallowRef<number | undefined>();
const positionY = shallowRef<number | undefined>();
const metadataDialog = shallowRef(false);
const refreshDialog = shallowRef(false);
const identifyItemDialog = shallowRef(false);
const mediaInfoDialog = shallowRef(false);

const isActive = computed(() => show.value || metadataDialog.value || refreshDialog.value || identifyItemDialog.value || mediaInfoDialog.value);

watch(isActive, (newVal) => {
  newVal ? emit('active') : emit('inactive');
});

const errorMessage = t('anErrorHappened');
const isItemRefreshing = computed(
  () => taskManager.getTask(item.Id ?? '') !== undefined
);
const itemDeletionName = computed(() => {
  const parentName = item.Name ?? undefined;
  const mediaSource = item.MediaSources?.[mediaSourceIndex ?? -1];

  if (mediaSource?.Name) {
    let name = mediaSource.Name;

    if (parentName) {
      name = `${parentName} - ${name}`;
    }

    return name;
  }

  return parentName;
});

/**
 * == ACTIONS ==
 */
/**
 * Playback related actions
 */
const playNextAction = {
  title: t('playNext'),
  icon: IMdiPlaySpeed,
  action: async (): Promise<void> => {
    await playbackManager.playNext(item);
    useSnackbar(t('itemPlayNext'), 'success');
  }
};
const pushToTopOfQueueAction = {
  title: t('pushToTop'),
  icon: IMdiArrowExpandUp,
  action: (): void => {
    playbackManager.changeItemPosition(item.Id, 0);
  }
};
const removeFromQueueAction = {
  title: t('removeFromQueue'),
  icon: IMdiPlaylistMinus,
  action: (): void => {
    playbackManager.removeFromQueue(item.Id || '');
  }
};
const pushToBottomOfQueueAction = {
  title: t('pushToBottom'),
  icon: IMdiArrowExpandDown,
  action: (): void => {
    playbackManager.changeItemPosition(
      item.Id,
      playbackManager.queue.length - 1
    );
  }
};
const playFromBeginningAction = {
  title: t('playFromBeginning'),
  icon: IMdiReplay,
  action: async (): Promise<void> => {
    await playbackManager.play({
      item: item
    });
  }
};
const shuffleAction = {
  title: t('shuffle'),
  icon: IMdiShuffle,
  action: async (): Promise<void> => {
    await playbackManager.play({
      item: item,
      initiator: item,
      startShuffled: true
    });
  }
};
const addToQueueAction = {
  title: t('addToQueue'),
  icon: IMdiPlaylistPlus,
  action: async (): Promise<void> => {
    await playbackManager.addToQueue(item);
    useSnackbar(t('addedToQueue'), 'success');
  }
};
const instantMixAction = {
  title: t('instantMix'),
  icon: IMdiDisc,
  action: async (): Promise<void> => {
    if (item.Id) {
      try {
        await playbackManager.instantMixFromItem(item.Id);
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
        if (!itemId.value) {
          return;
        }

        try {
          await apiStore.itemDelete(itemId.value);

          if (itemId.value === item.Id && route.fullPath.includes(itemId.value)) {
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
        subtitle: itemDeletionName.value,
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
const copyDownloadURLAction = {
  title: t('copyStreamURL'),
  icon: IMdiContentCopy,
  action: async (): Promise<void> => {
    const clipboard = useClipboard();
    let streamUrls: Map<string, string> | string | undefined;

    if (!clipboard.isSupported.value) {
      useSnackbar(t('clipboardUnsupported'), 'error');

      return;
    }

    if (item.Id) {
      switch (item.Type) {
        case 'Season': {
          streamUrls = await getItemSeasonDownloadMap(item.Id);
          break;
        }
        case 'Series': {
          streamUrls = await getItemSeriesDownloadMap(item.Id);
          break;
        }
        default: {
          streamUrls = getItemDownloadUrl(itemId.value);
          break;
        }
      }

      /**
       * The Map is mapped to an string like: EpisodeName: DownloadUrl
       */
      const text
        = streamUrls instanceof Map
          ? [...streamUrls.entries()]
              .map(([k, v]) => `(${k}) - ${v}`)
              .join('\n')
          : streamUrls;

      const copyAction = async (txt: string): Promise<void> => {
        await clipboard.copy(txt);
        useSnackbar(t('clipboardSuccess'), 'success');
      };

      if (text) {
        await (isStr(streamUrls)
          ? copyAction(text)
          : useConfirmDialog(async () => { await copyAction(text); }, {
            title: t('copyPrompt'),
            text: text,
            confirmText: t('accept')
          }));
      } else {
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
    queue
    && playbackManager.queueIds.includes(item.Id || '')
  ) {
    queueOptions.push(pushToTopOfQueueAction);

    if (playbackManager.currentItem?.Id !== item.Id) {
      queueOptions.push(removeFromQueueAction);
    }

    if (
      playbackManager.nextItem?.Id !== item.Id
      && playbackManager.currentItem?.Id !== item.Id
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

  if (canResume(item)) {
    playbackOptions.push(playFromBeginningAction);
  }

  playbackOptions.push(shuffleAction);

  if (playbackManager.currentItem) {
    if (
      playbackManager.nextItem?.Id !== item.Id
      && playbackManager.currentItem.Id !== item.Id
      && !queue
    ) {
      playbackOptions.push(playNextAction);
    }

    playbackOptions.push(addToQueueAction);
  }

  if (canInstantMix(item) && playbackManager.currentItem) {
    playbackOptions.push(instantMixAction);
  }

  return playbackOptions;
}

/**
 * Copy and download action for the current selected item
 */
function getCopyOptions(): MenuOption[] {
  const copyActions: MenuOption[] = [];

  if (remote.auth.currentUser?.Policy?.EnableContentDownloading) {
    copyActions.push(copyDownloadURLAction);
  }

  return copyActions;
}

/**
 * Library options for libraries
 */
function getLibraryOptions(): MenuOption[] {
  const libraryOptions: MenuOption[] = [];

  if (item.MediaSources) {
    libraryOptions.push(mediaInfoAction);
  }

  if (canRefreshMetadata(item)) {
    libraryOptions.push(refreshAction);
  }

  if (remote.auth.currentUser?.Policy?.IsAdministrator) {
    libraryOptions.push(editMetadataAction);

    if (canIdentify(item)) {
      libraryOptions.push(identifyItemAction);
    }
  }

  if (
    remote.auth.currentUser?.Policy?.EnableContentDeletion
    || remote.auth.currentUser?.Policy?.EnableContentDeletionFromFolders
  ) {
    libraryOptions.push(deleteItemAction);
  }

  return libraryOptions;
}

const options = computed(() => {
  return [
    getQueueOptions(),
    getPlaybackOptions(),
    getCopyOptions(),
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

<style scoped>
.text {
  font-size: unset !important;
  line-height: unset !important;
}
</style>
