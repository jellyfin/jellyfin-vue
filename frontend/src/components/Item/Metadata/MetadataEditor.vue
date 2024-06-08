<template>
  <VCard
    v-if="metadata"
    height="100%"
    class="d-flex flex-column metadata-editor">
    <VCardTitle>{{ t('editMetadata') }}</VCardTitle>
    <VCardSubtitle class="pb-3">
      {{ metadata.Path }}
    </VCardSubtitle>

    <VDivider />

    <VCardText
      class="pa-0 flex-grow-1"
      :class="{
        'd-flex': !$vuetify.display.mobile,
        'flex-row': !$vuetify.display.mobile
      }">
      <VTabs
        v-model="tabName"
        :direction="$vuetify.display.mobile ? 'horizontal' : 'vertical'">
        <VTab value="general">
          {{ t('general') }}
        </VTab>
        <VTab value="details">
          {{ t('details') }}
        </VTab>
        <VTab value="castAndCrew">
          {{ t('castAndCrew') }}
        </VTab>
        <VTab value="images">
          {{ t('images') }}
        </VTab>
      </VTabs>
      <VWindow
        v-model="tabName"
        class="pa-2 flex-fill">
        <VWindowItem value="general">
          <VSelect
            v-if="contentOptions.length"
            v-model="contentOption"
            :items="contentOptions"
            :label="t('contentType')"
            item-title="key"
            item-value="value"
            return-object />
          <VTextField
            v-model="metadata.Name"
            variant="outlined"
            :label="t('title')" />
          <VTextField
            v-model="metadata.OriginalTitle"
            variant="outlined"
            :label="t('originalTitle')" />
          <VTextField
            v-model="metadata.ForcedSortName"
            variant="outlined"
            :label="t('sortTitle')" />
          <VTextField
            v-model="tagLine"
            variant="outlined"
            :label="t('tagline')" />
          <VTextarea
            v-model="metadata.Overview"
            variant="outlined"
            no-resize
            rows="4"
            :label="t('overview')" />
        </VWindowItem>
        <VWindowItem value="details">
          <DateInput
            :value="dateCreated"
            :label="t('dateAdded')"
            @update:date="
              (value) => formatAndAssignDate('DateCreated', value)
            " />
          <VRow>
            <VCol
              sm="6"
              cols="12">
              <VTextField
                v-model="metadata.CommunityRating"
                variant="outlined"
                :label="t('communityRating')" />
            </VCol>
            <VCol
              sm="6"
              cols="12">
              <VTextField
                v-model="metadata.CriticRating"
                variant="outlined"
                :label="t('criticRating')" />
            </VCol>
          </VRow>

          <DateInput
            :value="premiereDate"
            :label="t('releaseDate')"
            @update:date="
              (value) => formatAndAssignDate('PremiereDate', value)
            " />
          <VTextField
            v-model="metadata.ProductionYear"
            variant="outlined"
            :label="t('year')" />
          <VTextField
            v-model="metadata.OfficialRating"
            variant="outlined"
            :label="t('parentalRating')" />
          <VTextField
            v-model="metadata.CustomRating"
            variant="outlined"
            :label="t('customRating')" />
          <VCombobox
            v-model="genresModel"
            :items="genres"
            :label="t('genres')"
            hide-selected
            multiple
            variant="outlined"
            :hide-no-data="false"
            chips
            closable-chips />
          <VCombobox
            v-model="tagsModel"
            :label="t('tags')"
            multiple
            variant="outlined"
            chips
            closable-chips />
        </VWindowItem>
        <VWindowItem value="castAndCrew">
          <VList lines="two">
            <VListItem
              :title="t('addNewPerson')"
              @click="onPersonAdd">
              <template #append>
                <VAvatar>
                  <VIcon>
                    <IMdiPlusCircle />
                  </VIcon>
                </VAvatar>
              </template>
            </VListItem>
            <VListItem
              v-for="(item, i) in metadata.People"
              :key="`${item.Id}-${i}`"
              :title="item.Name ?? undefined"
              :subtitle="(item.Role || item.Type) ?? undefined"
              @click="onPersonEdit(item)">
              <template #prepend>
                <VAvatar>
                  <JImg
                    v-if="item.Id && item.PrimaryImageTag"
                    :src="
                      remote.sdk.api?.getItemImageUrl(
                        item.Id,
                        ImageType.Primary
                      )
                    ">
                    <template #placeholder>
                      <VIcon
                        class="bg-grey-darken-3">
                        <IMdiAccount />
                      </VIcon>
                    </template>
                  </JImg>
                </VAvatar>
              </template>
              <template #append>
                <VAvatar @click.stop="onPersonDel(i)">
                  <VIcon>
                    <IMdiDelete />
                  </VIcon>
                </VAvatar>
              </template>
            </VListItem>
          </VList>
          <PersonEditor
            :person="person"
            @update:person="onPersonSave"
            @close="person = undefined" />
        </VWindowItem>
        <VWindowItem value="images">
          <ImageEditor :metadata="metadata" />
        </VWindowItem>
      </VWindow>
    </VCardText>

    <VDivider />
    <VCardActions
      class="d-flex align-center pa-3"
      :class="{
        'justify-end': !$vuetify.display.mobile,
        'justify-center': $vuetify.display.mobile
      }">
      <VBtn
        variant="flat"
        width="8em"
        color="secondary"
        class="mr-1"
        @click="emit('cancel')">
        {{ t('cancel') }}
      </VBtn>
      <VBtn
        variant="flat"
        width="8em"
        color="primary"
        :loading="loading"
        @click="saveMetadata">
        {{ t('save') }}
      </VBtn>
    </VCardActions>
  </VCard>
</template>

<script setup lang="ts">
import {
  ImageType,
  type BaseItemDto,
  type BaseItemPerson
} from '@jellyfin/sdk/lib/generated-client';
import { getGenresApi } from '@jellyfin/sdk/lib/utils/api/genres-api';
import { getItemUpdateApi } from '@jellyfin/sdk/lib/utils/api/item-update-api';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { AxiosError } from 'axios';
import { format, formatISO } from 'date-fns';
import { pick, set } from 'lodash-es';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { watchImmediate } from '@vueuse/core';
import { isArray } from '@/utils/validation';
import { remote } from '@/plugins/remote';
import { useSnackbar } from '@/composables/use-snackbar';
import { useDateFns } from '@/composables/use-datefns';

interface ContentOption {
  value: string;
  key: string;
}

const props = defineProps<{ itemId: string }>();

const emit = defineEmits<{
  'save': [];
  'update:forceRefresh': [];
  'cancel': [];
}>();

const { t } = useI18n();

const metadata = ref<BaseItemDto>();
const menu = ref(false);
const person = ref<BaseItemPerson>();
const genres = ref<string[]>([]);
const loading = ref(false);
const tabName = ref<string>();
const contentOptions = ref<ContentOption[]>([]);
const contentOption = ref<ContentOption>();
const contentType = ref<string>();
const genresModel = computed({
  get() {
    return metadata.value?.Genres === null ? undefined : metadata.value?.Genres;
  },
  set(newVal) {
    if (isArray(newVal) && metadata.value) {
      metadata.value.Genres = newVal;
    }
  }
});
const tagsModel = computed({
  get() {
    return metadata.value?.Tags === null ? undefined : metadata.value?.Tags;
  },
  set(newVal) {
    if (isArray(newVal) && metadata.value) {
      metadata.value.Tags = newVal;
    }
  }
});

const premiereDate = computed(() => {
  if (!metadata.value?.PremiereDate) {
    return '';
  }

  return useDateFns(format, new Date(metadata.value.PremiereDate), 'yyyy-MM-dd');
});

const dateCreated = computed(() => {
  if (!metadata.value?.DateCreated) {
    return '';
  }

  return useDateFns(format, new Date(metadata.value.DateCreated), 'yyyy-MM-dd');
});

const tagLine = computed({
  get: () => metadata.value?.Taglines?.[0] ?? '',
  set: (v) => {
    if (metadata.value) {
      if (!metadata.value.Taglines) {
        metadata.value.Taglines = [];
      }

      metadata.value.Taglines[0] = v;
    }
  }
});

/**
 * Fetch data ancestors for the current item
 */
async function getData(): Promise<void> {
  const itemInfo = (
    await remote.sdk.newUserApi(getUserLibraryApi).getItem({
      userId: remote.auth.currentUserId ?? '',
      itemId: props.itemId
    })
  ).data;

  const options = (
    await remote.sdk.newUserApi(getItemUpdateApi).getMetadataEditorInfo({
      itemId: props.itemId
    })
  ).data;

  contentOptions.value
    = options.ContentTypeOptions?.map((r) => {
      if (r.Name) {
        return {
          // The option name
          key: r.Name,
          // The one that will be sent
          value: r.Value ?? ''
        };
      }
    }).filter((r): r is ContentOption => r !== undefined) ?? [];
  contentOption.value
    = contentOptions.value.find(r => r.value === options.ContentType)
    ?? contentOptions.value[0];
  contentType.value = options.ContentType ?? contentOption.value.value;

  metadata.value = itemInfo;

  if (!metadata.value.Id) {
    return;
  }

  const ancestors = await remote.sdk.newUserApi(getLibraryApi).getAncestors({
    userId: remote.auth.currentUserId ?? '',
    itemId: metadata.value.Id
  });
  const libraryInfo = ancestors.data.find(
    index => index.Type === 'CollectionFolder'
  );

  if (!libraryInfo?.Id) {
    return;
  }

  await getGenres(libraryInfo.Id);
}

/**
 * Get genres associated with the current item
 */
async function getGenres(parentId: string): Promise<void> {
  genres.value
    = (
      await remote.sdk.newUserApi(getGenresApi).getGenres({
        parentId
      })
    ).data.Items?.map(index => index.Name).filter(
      (genre): genre is string => !!genre
    ) ?? [];
}

/**
 * Save metadata content type for the current item
 */
async function saveContentType(): Promise<void> {
  if (!contentOption.value) {
    return;
  }

  if (!metadata.value?.Id) {
    return;
  }

  if (contentOption.value.value !== contentType.value) {
    await remote.sdk.newUserApi(getItemUpdateApi).updateItemContentType({
      itemId: metadata.value.Id,
      contentType: contentOption.value.value
    });
  }
}

/**
 * Save metadata for the current item
 */
async function saveMetadata(): Promise<void> {
  if (!metadata.value?.Id) {
    return;
  }

  const item = pick(metadata.value, [
    'Id',
    'Name',
    'OriginalTitle',
    'ForcedSortName',
    'CommunityRating',
    'CriticRating',
    'IndexNumber',
    'AirsBeforeSeasonNumber',
    'AirsAfterSeasonNumber',
    'AirsBeforeEpisodeNumber',
    'ParentIndexNumber',
    'DisplayOrder',
    'Album',
    'AlbumArtists',
    'ArtistItems',
    'Overview',
    'Status',
    'AirDays',
    'AirTime',
    'Genres',
    'Tags',
    'Studios',
    'PremiereDate',
    'DateCreated',
    'EndDate',
    'ProductionYear',
    'AspectRatio',
    'Video3DFormat',
    'OfficialRating',
    'CustomRating',
    'People',
    'LockData',
    'LockedFields',
    'ProviderIds',
    'PreferredMetadataLanguage',
    'PreferredMetadataCountryCode',
    'Taglines'
  ]);

  try {
    loading.value = true;

    if (!metadata.value.Id) {
      throw new Error('Expected metadata to have id');
    }

    await remote.sdk.newUserApi(getItemUpdateApi).updateItem({
      itemId: metadata.value.Id,
      baseItemDto: item
    });
    await saveContentType();
    emit('save');
    useSnackbar(t('saved'), 'success');
  } catch (error) {
    /*
     * TODO: This whole block should be removed - we should verify that the data is correct client-side before posting to server
     * not expecting bad request messages.
     * TODO: Revise similar blocks like this through the entire codebase.
     */
    let errorMessage = t('unexpectedError');

    if (error instanceof AxiosError && error.response?.status === 400) {
      errorMessage = t('badRequest');
    }

    useSnackbar(errorMessage, 'error');
  } finally {
    loading.value = false;
  }
}

/**
 * Formats and updates dates
 */
function formatAndAssignDate(key: keyof BaseItemDto, date: string): void {
  if (!metadata.value) {
    return;
  }

  menu.value = false;
  set(metadata.value, key, formatISO(new Date(date)));
}

/**
 * Handle adding a person
 */
function onPersonAdd(): void {
  onPersonEdit({});
}

/**
 * Handle editing a person
 */
function onPersonEdit(item: BaseItemPerson): void {
  person.value = item;
}

/**
 * Handle saving a person after editing
 */
function onPersonSave(item: BaseItemPerson): void {
  if (!metadata.value?.People) {
    return;
  }

  if (item.Id) {
    metadata.value.People = metadata.value.People.map(p =>
      p.Id === item.Id ? item : p
    );
  } else {
    // Undefined id means that the person was newly added
    metadata.value.People.push(item);
  }

  person.value = undefined;
}

/**
 * Handle deleting a person
 */
function onPersonDel(index: number): void {
  if (!metadata.value?.People) {
    return;
  }

  metadata.value.People.splice(index, 1);
}

watchImmediate(() => props.itemId, getData);
</script>
