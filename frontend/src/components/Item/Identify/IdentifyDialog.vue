<template>
  <GenericDialog
    :model-value="model"
    :title="$t('identify')"
    :subtitle="itemPath"
    :loading="isLoading"
    @close="close">
    <template #loader>
      <VProgressLinear
        v-model="progress"
        :indeterminate="isLoading" />
    </template>

    <template #toolbarPrepend>
      <VBtn
        icon
        :disabled="tabName === 'searchMenu'"
        @click="clear">
        <JIcon class="i-mdi:arrow-left" />
      </VBtn>
    </template>

    <VCardText
      class="pa-0 flex-grow-1 px-2"
      :class="{
        'd-flex': !$vuetify.display.mobile,
        'flex-row': !$vuetify.display.mobile
      }">
      <VWindow
        v-model="tabName"
        class="pa-2 flex-fill">
        <VWindowItem value="searchMenu">
          <VCol>
            <VTextField
              v-for="(field, idx) in searchFields"
              :key="field.key"
              v-model="fieldsInputs[idx].value"
              variant="outlined"
              class="mb-2"
              :placeholder="field.value ?? undefined"
              :persistent-placeholder="field.value ? true : false"
              clearable
              :disabled="isLoading"
              :type="field.type"
              :label="field.title" />
          </VCol>
        </VWindowItem>
        <VWindowItem value="resultsMenu">
          <h3>{{ $t('results') }}</h3>
          <div class="text-subtitle-1 mt-2">
            {{ $t('identifyInstructResult') }}
          </div>
          <VCheckbox
            v-if="searchResults"
            v-model="replaceImage"
            class="mt-2 d-flex"
            color="primary">
            <template #append>
              {{ $t('replaceExistingImages') }}
            </template>
          </VCheckbox>
          <VDivider />
          <IdentifyResults
            v-if="isArray(searchResults) && searchResults.length"
            :items="searchResults"
            :item-type="item.Type"
            @select="applySelectedSearch" />
          <h3
            v-else
            class="text-center my-4">
            {{ $t('searchNoResults') }}
          </h3>
        </VWindowItem>
      </VWindow>
    </VCardText>

    <template #actions>
      <VBtn
        v-if="tabName === 'searchMenu'"
        variant="flat"
        width="8em"
        color="primary"
        :loading="isLoading"
        @click="performSearch">
        {{ t('search') }}
      </VBtn>
    </template>
  </GenericDialog>
</template>

<script setup lang="ts">
import type {
  BaseItemDto,
  RemoteSearchResult
} from '@jellyfin/sdk/lib/generated-client';
import { getItemLookupApi } from '@jellyfin/sdk/lib/utils/api/item-lookup-api';
import { computed, ref, shallowRef, toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import { isArray, isNil, isStr } from '@jellyfin-vue/shared/validation';
import { useConfirmDialog } from '#/composables/use-confirm-dialog';
import { useSnackbar } from '#/composables/use-snackbar';
import { remote } from '#/plugins/remote';

interface IdentifyField {
  key: string;
  title: string;
  type: string;
  value?: string | null;
}

const { item } = defineProps<{ item: BaseItemDto }>();

const emit = defineEmits<{
  close: [];
}>();

/**
 * Closes the dialog and kills the DOM element.
 */
function close(): void {
  model.value = false;
  emit('close');
}

const { t } = useI18n();

const availableProviders = (
  await remote.sdk.newUserApi(getItemLookupApi).getExternalIdInfos({
    itemId: item.Id ?? ''
  })
).data;

const model = shallowRef(true);
const isLoading = shallowRef(false);
const searchResults = ref<RemoteSearchResult[]>();
const replaceImage = shallowRef(false);
const errorMessage = t('anErrorHappened');
const searchFields = computed<IdentifyField[]>(() => {
  const result = [
    {
      key: 'search-name',
      title: t('name'),
      type: 'string',
      value: item.Name ?? ''
    }
  ];

  if (!['BoxSet', 'Person'].includes(item.Type ?? '')) {
    result.push({
      key: 'search-year',
      title: t('year'),
      type: 'number',
      value: item.ProductionYear ? String(item.ProductionYear) : ''
    });
  }

  /**
   * Providers that the item already has
   */
  if (item.ProviderIds) {
    for (const key in item.ProviderIds) {
      result.push({
        key,
        value: item.ProviderIds[key],
        title: `${key} ID`,
        type: 'string'
      });
    }
  }

  /**
   * Providers available for the item type, but not assigned to it
   */
  const populatedKeys = Object.keys(item.ProviderIds ?? {});
  const missingProviders = availableProviders
    .filter(p => !populatedKeys.includes(p.Key ?? ''))
    .map(p => p.Key)
    .filter((p): p is string => !isNil(p));

  for (const key of missingProviders) {
    result.push({
      key,
      value: '',
      title: `${key} ID`,
      type: 'string'
    });
  }

  return result;
});
/**
 * TODO: Refactor to remove this use of structuredClone
 */
const fieldsInputs = ref<IdentifyField[]>(
  structuredClone(toRaw(searchFields.value))
);
const tabName = computed(() =>
  isNil(searchResults.value) ? 'searchMenu' : 'resultsMenu'
);
const progress = computed(() => {
  switch (tabName.value) {
    case 'searchMenu': {
      return 50;
    }
    case 'resultsMenu': {
      return 100;
    }
    default: {
      return 0;
    }
  }
});
const itemPath = computed<string | undefined>(() => item.Path ?? undefined);

/**
 * Get the remote search results for an item and search params.
 *
 * @param item - The item to search for.
 * @param searches - The search params to use.
 * @returns - An array of remote search results.
 */
async function getItemRemoteSearch(
  item: BaseItemDto,
  fields: IdentifyField[]
): Promise<RemoteSearchResult[] | undefined> {
  interface Query {
    Name?: string;
    Year?: number;
    ProviderIds: Record<string, string>;
  }

  const searcher = remote.sdk.newUserApi(getItemLookupApi);
  const itemId = item.Id;

  if (isNil(itemId)) {
    return;
  }

  const searchQuery: Query = {
    Name: undefined,
    Year: undefined,
    ProviderIds: {}
  };

  /**
   * Our search fields are formatted with a key that denotes what
   * they should be used for in the query search.
   *
   * The `search-` prefix are used as the "information" that will be submitted
   * to the providers when searching (usually Name and Year).
   *
   * Every other key are the provider IDs, either prefilled or provided by user.
   * These provider IDs are basically directly use to pull information from said provider.
   */
  for (const field of fields) {
    const value
      = isStr(field.value) ? field.value.trim() : field.value;

    if (field.key === 'search-name' && value) {
      searchQuery.Name = value;
    } else if (field.key === 'search-year' && value) {
      searchQuery.Year = Number(value);
    } else if (value) {
      searchQuery.ProviderIds[field.key] = value;
    }
  }

  switch (item.Type) {
    case 'Book': {
      return (
        await searcher.getBookRemoteSearchResults({
          bookInfoRemoteSearchQuery: {
            ItemId: itemId,
            SearchInfo: searchQuery
          }
        })
      ).data;
    }
    case 'BoxSet': {
      return (
        await searcher.getBoxSetRemoteSearchResults({
          boxSetInfoRemoteSearchQuery: {
            ItemId: itemId,
            SearchInfo: searchQuery
          }
        })
      ).data;
    }
    case 'Movie': {
      return (
        await searcher.getMovieRemoteSearchResults({
          movieInfoRemoteSearchQuery: {
            ItemId: itemId,
            SearchInfo: searchQuery
          }
        })
      ).data;
    }
    case 'MusicAlbum': {
      return (
        await searcher.getMusicAlbumRemoteSearchResults({
          albumInfoRemoteSearchQuery: {
            ItemId: itemId,
            SearchInfo: searchQuery
          }
        })
      ).data;
    }
    case 'MusicArtist': {
      return (
        await searcher.getMusicArtistRemoteSearchResults({
          artistInfoRemoteSearchQuery: {
            ItemId: itemId,
            SearchInfo: searchQuery
          }
        })
      ).data;
    }
    case 'MusicVideo': {
      return (
        await searcher.getMusicVideoRemoteSearchResults({
          musicVideoInfoRemoteSearchQuery: {
            ItemId: itemId,
            SearchInfo: searchQuery
          }
        })
      ).data;
    }
    case 'Person': {
      return (
        await searcher.getPersonRemoteSearchResults({
          personLookupInfoRemoteSearchQuery: {
            ItemId: itemId,
            SearchInfo: searchQuery
          }
        })
      ).data;
    }
    case 'Series': {
      return (
        await searcher.getSeriesRemoteSearchResults({
          seriesInfoRemoteSearchQuery: {
            ItemId: itemId,
            SearchInfo: searchQuery
          }
        })
      ).data;
    }
    case 'Trailer': {
      return (
        await searcher.getTrailerRemoteSearchResults({
          trailerInfoRemoteSearchQuery: {
            ItemId: itemId,
            SearchInfo: searchQuery
          }
        })
      ).data;
    }
  }
}

/**
 * Do a search for information on the item.
 */
async function performSearch(): Promise<void> {
  isLoading.value = true;

  try {
    const results = await getItemRemoteSearch(item, fieldsInputs.value);

    searchResults.value = isArray(results) ? results : [];
  } catch (error) {
    console.error(error);

    useSnackbar(errorMessage, 'error');
  } finally {
    isLoading.value = false;
  }
}

/**
 * Apply the selected search result to the item.
 */
async function applySelectedSearch(result: RemoteSearchResult): Promise<void> {
  await useConfirmDialog(
    async () => {
      isLoading.value = true;

      try {
        await remote.sdk.newUserApi(getItemLookupApi).applySearchCriteria({
          itemId: item.Id ?? '',
          remoteSearchResult: result,
          replaceAllImages: replaceImage.value
        });
      } catch (error) {
        console.error(error);

        useSnackbar(errorMessage, 'error');
      } finally {
        isLoading.value = false;
        model.value = false;
      }
    },
    {
      title: '',
      text: t('identifyConfirmChanges', {
        originalItem: item.Name,
        newIdentifiedItem: result.Name
      }),
      confirmText: t('confirm')
    }
  );
}

/**
 * Clear search results
 */
function clear(): void {
  searchResults.value = undefined;
}
</script>
