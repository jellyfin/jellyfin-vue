<template>
  <v-dialog
    content-class="identify-dialog"
    :model-value="model"
    :fullscreen="$vuetify.display.mobile"
    @after-leave="emit('close')">
    <v-card
      v-if="externalInfos && searchData && item"
      height="100%"
      class="d-flex flex-column identify-tab">
      <v-card-title>{{ $t('identify') }}</v-card-title>
      <v-card-subtitle class="pb-3">
        {{ itemPath }}
      </v-card-subtitle>

      <v-divider />

      <v-card-text
        class="pa-0 flex-grow-1"
        :class="{
          'd-flex': !$vuetify.display.mobile,
          'flex-row': !$vuetify.display.mobile
        }">
        <v-tabs
          v-model="tabName"
          :direction="$vuetify.display.mobile ? 'horizontal' : 'vertical'">
          <v-tab value="searchMenu">{{ $t('search.name') }}</v-tab>
          <v-tab :disabled="isSearching || firstTime" value="resultsMenu">
            {{ $t('results') }}
          </v-tab>
        </v-tabs>
        <v-window v-model="tabName" class="pa-2 flex-fill">
          <v-window-item value="searchMenu">
            <v-col>
              <v-text-field
                v-for="(data, idx) in searchData"
                :key="data.key"
                v-model="searchData[idx].value"
                variant="outlined"
                class="mb-2"
                :disabled="isSearching"
                :type="data.type"
                :label="data.title" />
            </v-col>
          </v-window-item>
          <v-window-item value="resultsMenu">
            <h3>Results</h3>
            <div class="mt-2 text-subtitle-1">
              {{ $t('identifyInstructResult') }}
            </div>
            <v-checkbox
              v-if="searchResults"
              v-model="replaceImage"
              class="d-flex mt-2"
              color="primary">
              <template #append>
                {{ $t('identifyReplaceImages') }}
              </template>
            </v-checkbox>
            <v-divider />
            <div
              class="d-flex flex-row flex-wrap mt-4"
              :class="{
                'justify-center': $vuetify.display.mobile
              }">
              <identify-result
                v-for="(result, idx) in searchResults"
                :key="idx"
                :item="result"
                :item-type="item.Type"
                @select="applySelectedSearch" />
            </div>
            <h3
              v-if="Array.isArray(searchResults) && searchResults.length === 0"
              class="text-center my-4">
              {{ $t('searchNoResults') }}
            </h3>
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-divider />
      <v-card-actions
        class="d-flex align-center pa-3"
        :class="{
          'justify-end': !$vuetify.display.mobile,
          'justify-center': $vuetify.display.mobile
        }">
        <v-btn
          variant="flat"
          width="8em"
          color="secondary"
          class="mr-1"
          :disabled="isSearching || isSaving"
          @click="emit('close')">
          {{ t('cancel') }}
        </v-btn>
        <v-btn
          v-if="tabName === 'searchMenu'"
          variant="flat"
          width="8em"
          color="primary"
          :loading="isSearching || isSaving"
          @click="searchInformation">
          {{ t('search.name') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import {
  BaseItemDto,
  ExternalIdInfo,
  RemoteSearchResult
} from '@jellyfin/sdk/lib/generated-client';
import { getItemLookupApi } from '@jellyfin/sdk/lib/utils/api/item-lookup-api';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRemote, useSnackbar } from '@/composables';
import { IdentifySearchItem, getItemRemoteSearch } from '@/utils/items';

const props = defineProps<{ item: BaseItemDto; mediaSourceIndex?: number }>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { t } = useI18n();
const remote = useRemote();
const tabName = ref<string>('searchMenu');
const model = ref(true);
// Block user from going to Results tab when no search has been done
const firstTime = ref(true);
const isSearching = ref(false);
const isSaving = ref(false);

type PrefilledSearch = {
  key: string;
  value: string;
};

const externalInfos = ref<ExternalIdInfo[]>();
const searchData = ref<IdentifySearchItem[]>();
const searchResults = ref<RemoteSearchResult[]>();
const replaceImage = ref(false);

const itemPath = computed(() => {
  if (!props.item) {
    return '';
  }

  if (props.mediaSourceIndex !== undefined) {
    return props.item.MediaSources?.[props.mediaSourceIndex]?.Path ?? '';
  }

  return props.item.Path ?? '';
});

/**
 * Do a search for information on the item.
 */
async function searchInformation(): Promise<void> {
  if (props.item !== undefined && searchData.value !== undefined) {
    isSearching.value = true;
    firstTime.value = false;

    try {
      const results = await getItemRemoteSearch(props.item, searchData.value);

      if (Array.isArray(results)) {
        searchResults.value = results;
        tabName.value = 'resultsMenu';
      } else {
        useSnackbar(t('identifySearchError'), 'error');
      }
    } catch (error) {
      console.error(error);

      useSnackbar(t('identifySearchError'), 'error');
    } finally {
      isSearching.value = false;
    }
  }
}

/**
 * Apply the selected search result to the item.
 */
async function applySelectedSearch(result: RemoteSearchResult): Promise<void> {
  isSaving.value = true;

  if (!props.item) {
    return;
  }

  try {
    await remote.sdk.newUserApi(getItemLookupApi).applySearchCriteria({
      itemId: props.item.Id ?? '',
      remoteSearchResult: result,
      replaceAllImages: replaceImage.value
    });
  } catch (error) {
    console.error(error);

    useSnackbar(t('identifyApplyError'), 'error');
  } finally {
    isSaving.value = false;
    emit('close');
    tabName.value = 'searchMenu';
  }
}

interface MatchPattern {
  key: string;
  pattern: RegExp;
}

/**
 * Get a pre-filled search data object.
 */
function getFilledSearchData(
  item: BaseItemDto,
  externals: ExternalIdInfo[]
): PrefilledSearch[] {
  const urls = item.ExternalUrls ?? [];

  if (!urls) {
    return [];
  }

  const matcher = externals
    .map((e) => {
      if (e.UrlFormatString && e.Key) {
        const pattern = e.UrlFormatString.replace(
          /{\d+}/g,
          '([\\w\\d_\\-+.]+)'
        );

        return {
          key: e.Key,
          pattern: new RegExp(`^${pattern}$`)
        };
      }
    })
    .filter((e): e is MatchPattern => e !== undefined);

  return urls
    .map((url) => {
      if (url.Url) {
        for (const match of matcher) {
          const result = match.pattern.exec(url.Url);

          if (result) {
            const last = result[result.length - 1];

            return {
              key: match.key,
              value: last
            };
          }
        }
      }
    })
    .filter((e): e is PrefilledSearch => e !== undefined);
}

watch(
  () => props.item,
  async () => {
    tabName.value = 'searchMenu';

    const results = (
      await remote.sdk.newUserApi(getItemLookupApi).getExternalIdInfos({
        itemId: props.item.Id ?? ''
      })
    ).data;

    externalInfos.value = results;

    const initSearch: IdentifySearchItem[] = [
      {
        key: 'search-item-Name',
        title: t('name'),
        type: 'string'
      }
    ];

    if (!['BoxSet', 'Person'].includes(props.item.Type || '')) {
      initSearch.push({
        key: 'search-item-Year',
        title: t('year'),
        type: 'number'
      });
    }

    const prefilledSearch = getFilledSearchData(props.item, results);

    const webCrawlSearch: IdentifySearchItem[] = results.map((info) => {
      let title = info.Name ?? '';

      if (info.Type) {
        title += ` ${info.Type.split(/(?=[A-Z])/).join(' ')}`;
      }

      const prefillValue = prefilledSearch.find(
        (e) => e.key === info.Key
      )?.value;

      return {
        key: info.Key ?? '',
        value: prefillValue,
        title: `${title} ID`,
        type: 'string'
      };
    });

    searchData.value = [...initSearch, ...webCrawlSearch];
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.identify-dialog {
  height: 60vh;
}
</style>
