<template>
  <SettingsPage>
    <template #title>
      {{ t('homeScreen') }}
    </template>

    <template #content>
      <VCol
        md="6"
        class="uno-pb-4 uno-pt-0">
        <h2 class="uno-text-lg">
          {{ t('homeScreenSections') }}
        </h2>
        <JDraggableList
          :items="homeSectionModels"
          :item-key="(homeSection: any) => homeSection.id"
          :options="{ handle: '.home-section-drag-handle', filter: 'button' }"
          tag="div"
          @reorder="reorderHomeSections">
          <template #default="{ item, index }">
            <div class="home-section-drag-handle home-section-row uno-mt-2 uno-flex uno-cursor-grab uno-items-center uno-gap-2 uno-rounded uno-px-2 uno-py-1">
              <JIcon
                class="i-mdi:folder uno-flex-none"
                aria-hidden="true" />
              <span class="uno-flex-1">{{ item.value }}</span>
              <VBtn
                icon
                size="small"
                variant="text"
                :disabled="index === 0"
                @click.stop="moveHomeSection(index, index - 1)">
                <JIcon class="i-mdi:chevron-up" />
              </VBtn>
              <VBtn
                icon
                size="small"
                variant="text"
                :disabled="index === homeSectionModels.length - 1"
                @click.stop="moveHomeSection(index, index + 1)">
                <JIcon class="i-mdi:chevron-down" />
              </VBtn>
              <VBtn
                icon
                size="small"
                variant="text"
                @click.stop="deleteHomeSection(index)">
                <JIcon class="i-mdi:delete-outline" />
              </VBtn>
            </div>
          </template>
        </JDraggableList>
        <div class="uno-mt-6 uno-flex uno-items-center uno-gap-2">
          <VSelect
            v-model="newHomeSection"
            variant="outlined"
            hide-details
            :label="t('addHomeSection')"
            :items="availableHomeSections"
            item-title="value"
            item-value="id"
            :disabled="availableHomeSections.length === 0" />
          <VBtn
            icon
            :disabled="!newHomeSection"
            @click="addHomeSection">
            <JIcon class="i-mdi:plus-circle-outline" />
          </VBtn>
        </div>
        <h2 class="uno-mt-8 uno-text-lg">
          {{ t('libraries') }}
        </h2>
        <JDraggableList
          :items="orderedLibraryModels"
          :item-key="(library: any) => library.id"
          :options="{ handle: '.library-drag-handle', filter: 'button' }"
          tag="div"
          @reorder="reorderLibraries">
          <template #default="{ item, index }">
            <div class="library-drag-handle home-section-row uno-mt-2 uno-flex uno-cursor-grab uno-items-center uno-gap-2 uno-rounded uno-px-2 uno-py-1">
              <JIcon
                :class="item.icon"
                aria-hidden="true" />
              <span class="uno-ml-2 uno-flex-1">{{ item.value }}</span>
              <VBtn
                icon
                size="small"
                variant="text"
                :disabled="index === 0"
                @click.stop="moveLibrary(index, index - 1)">
                <JIcon class="i-mdi:chevron-up" />
              </VBtn>
              <VBtn
                icon
                size="small"
                variant="text"
                :disabled="index === orderedLibraryModels.length - 1"
                @click.stop="moveLibrary(index, index + 1)">
                <JIcon class="i-mdi:chevron-down" />
              </VBtn>
            </div>
          </template>
        </JDraggableList>
      </VCol>
    </template>
  </SettingsPage>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTranslation } from 'i18next-vue';
import { getUserViewsApi } from '@jellyfin/sdk/lib/utils/api/user-views-api';
import { userSettings } from '#/store/settings/user.ts';
import { useBaseItem } from '#/composables/apis.ts';
import { getLibraryIcon } from '#/utils/items.ts';
import { orderItemsById } from '#/utils/ordering.ts';

const { t } = useTranslation();
const { data: views } = await useBaseItem(getUserViewsApi, 'getUserViews')();

const homeSectionLabels: Record<string, string> = {
  smalllibrarytiles: t('myMedia'),
  librarybuttons: t('myMediaSmall'),
  latestmedia: t('recentlyAddedMedia'),
  nextup: t('nextUp'),
  resumevideo: t('continueWatching'),
  livetv: t('liveTv'),
  resumeaudio: t('continueListening'),
  resumebook: t('continueReading'),
  none: t('none')
};

const addableHomeSectionIds = [
  'smalllibrarytiles',
  'librarybuttons',
  'resumevideo',
  'nextup',
  'latestmedia'
] as const;

const homeSectionModels = computed(() =>
  userSettings.homeSections.value
    .filter(value => value !== '' && value !== 'none')
    .map(value => ({ value: homeSectionLabels[value], id: value }))
);
const newHomeSection = ref<string>();
const availableHomeSections = computed(() => {
  const configuredIds = new Set(homeSectionModels.value.map(({ id }) => id));

  return addableHomeSectionIds
    .filter(id => !configuredIds.has(id))
    .map(id => ({ id, value: homeSectionLabels[id] }));
});
const orderedLibraryModels = computed(() =>
  orderItemsById(views.value, userSettings.libraryOrder.value)
    .flatMap(library => library.Id
      ? [{
          id: library.Id,
          icon: getLibraryIcon(library.CollectionType),
          value: library.Name ?? ''
        }]
      : [])
);

/**
 * Move a home section to its newly selected position.
 */
function reorderHomeSections({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }): void {
  const ids = homeSectionModels.value.map(({ id }) => id);
  const [moved] = ids.splice(oldIndex, 1);

  if (!moved) {
    return;
  }

  ids.splice(newIndex, 0, moved);
  userSettings.homeSections.value = ids;
}

/**
 * Move a home section using the list controls.
 */
function moveHomeSection(oldIndex: number, newIndex: number): void {
  reorderHomeSections({ oldIndex, newIndex });
}

/**
 * Remove a section from the home screen.
 */
function deleteHomeSection(index: number): void {
  userSettings.homeSections.value
    = homeSectionModels.value
      .filter((_, currentIndex) => currentIndex !== index)
      .map(({ id }) => id);
}

/**
 * Append the selected section to the home screen.
 */
function addHomeSection(): void {
  const id = newHomeSection.value;

  if (!id || homeSectionModels.value.some(section => section.id === id)) {
    return;
  }

  userSettings.homeSections.value = [
    ...homeSectionModels.value.map(section => section.id),
    id
  ];
  newHomeSection.value = undefined;
}

/**
 * Move a library to its newly selected position.
 */
function reorderLibraries({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }): void {
  const ids = orderedLibraryModels.value.map(({ id }) => id);
  const [moved] = ids.splice(oldIndex, 1);

  if (!moved) {
    return;
  }

  ids.splice(newIndex, 0, moved);
  userSettings.libraryOrder.value = ids;
}

/**
 * Move a library using the list controls.
 */
function moveLibrary(oldIndex: number, newIndex: number): void {
  reorderLibraries({ oldIndex, newIndex });
}
</script>

<style scoped>
.home-section-row {
  min-height: 3rem;
  transition: background-color 150ms ease;
  user-select: none;
}

.home-section-row:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.08);
}
</style>
