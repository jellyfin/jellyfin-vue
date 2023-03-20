<template>
  <v-dialog
    :model-value="dialog"
    :fullscreen="$vuetify.display.mobile"
    content-class="image-search-dialog-content"
    @update:model-value="(value: boolean) => emit('update:dialog', value)">
    <v-card height="100%" class="image-search-card">
      <v-card-title>{{ t('search.name') }}</v-card-title>
      <v-divider />
      <v-row align="center" class="mx-16 my-4">
        <v-select
          v-model="source"
          class="mx-4"
          :items="sources"
          :disabled="loading"
          :label="t('metadata.source')"
          :placeholder="t('metadata.sourceAll')"
          persistent-placeholder
          variant="outlined"
          hide-details
          clearable />
        <v-select
          v-model="type"
          class="mx-4"
          :items="types"
          item-title="text"
          item-value="value"
          :disabled="loading"
          :label="t('metadata.type')"
          variant="outlined"
          hide-details />
        <v-checkbox
          v-model="allLanguages"
          class="mt-0 mx-4"
          :label="t('allLanguages')"
          :disabled="loading"
          hide-details />
      </v-row>
      <v-divider />
      <v-progress-circular
        v-if="loading"
        :size="70"
        :width="7"
        color="primary"
        indeterminate
        class="loading-bar" />
      <v-card v-else-if="images.length === 0" class="mx-auto">
        <v-card-title>
          {{ t('noImagesFound') }}
        </v-card-title>
      </v-card>
      <v-row v-else class="image-results">
        <v-col
          v-for="(item, i) in images"
          :key="`${item.Type}-${i}`"
          xl="1"
          lg="3"
          md="4"
          sm="6"
          xs="12">
          <v-card class="ma-2">
            <v-img
              v-if="item.Url"
              :src="item.Url"
              :aspect-ratio="getContainerAspectRatioForImageType(item.Type)" />
            <div class="text-center text-truncate text-subtitle-1 mt-2">
              {{ item.ProviderName }}
            </div>
            <div class="text-center text-body-2 text-grey-darken-2 info-box">
              <template v-if="item.Width && item.Height">
                {{ item.Width }} &times; {{ item.Height }}
                <template v-if="item.Language">
                  &middot; {{ item.Language }}
                </template>
              </template>
            </div>
            <div class="text-center text-body-2 text-grey-darken-2 info-box">
              <template v-if="item.CommunityRating">
                {{ item.CommunityRating.toFixed(1) }}
                <template v-if="item.VoteCount">
                  &middot; {{ item.VoteCount }} votes
                </template>
              </template>
            </div>
            <v-spacer />
            <v-card-actions class="justify-center">
              <v-btn icon :disabled="loading" @click="onDownload(item)">
                <v-icon>
                  <i-mdi-cloud-download />
                </v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  ImageProviderInfo,
  RemoteImageInfo,
  ImageType,
  BaseItemDto
} from '@jellyfin/sdk/lib/generated-client';
import { getRemoteImageApi } from '@jellyfin/sdk/lib/utils/api/remote-image-api';
import { getContainerAspectRatioForImageType } from '@/utils/images';
import { useRemote } from '@/composables';

const props = defineProps<{
  metadata: BaseItemDto;
  dialog: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:dialog', isOpen: boolean): void;
  (e: 'download-success', someting: boolean): void;
}>();

const { t } = useI18n();
const remote = useRemote();

const providers = ref<ImageProviderInfo[]>([]);
const type = ref<ImageType>(ImageType.Primary);
// eslint-disable-next-line unicorn/no-null -- the v-select component uses null to represent no value
const source = ref<ImageProviderInfo['Name'] | null>(null);
const allLanguages = ref(false);
const images = ref<RemoteImageInfo[]>([]);
const loading = ref(false);

const types = computed(() => [
  {
    value: ImageType.Primary,
    text: t('imageType.primary')
  },
  {
    value: ImageType.Art,
    text: t('imageType.art')
  },
  {
    value: ImageType.Backdrop,
    text: t('imageType.backdrop')
  },
  {
    value: ImageType.Banner,
    text: t('imageType.banner')
  },
  {
    value: ImageType.Box,
    text: t('imageType.box')
  },
  {
    value: ImageType.BoxRear,
    text: t('imageType.boxRear')
  },
  {
    value: ImageType.Disc,
    text: t('imageType.disc')
  },
  {
    value: ImageType.Logo,
    text: t('imageType.logo')
  },
  {
    value: ImageType.Menu,
    text: t('imageType.menu')
  },
  {
    value: ImageType.Screenshot,
    text: t('imageType.screenshot')
  },
  {
    value: ImageType.Thumb,
    text: t('imageType.thumb')
  }
]);

const sources = computed(() =>
  providers.value
    .filter(
      (provider) =>
        provider.Name &&
        provider.SupportedImages &&
        provider.SupportedImages.includes(type.value)
    )
    .map((provider) => provider.Name ?? '')
);

/**
 * Returns a list of image providers for the current item
 */
async function getRemoteImageProviders(): Promise<void> {
  if (!props.metadata.Id) {
    return;
  }

  providers.value = (
    await remote.sdk.newUserApi(getRemoteImageApi).getRemoteImageProviders({
      itemId: props.metadata.Id
    })
  ).data;
}

/**
 * Fetches the image information for the currently selected item given the filters
 */
async function getImages(): Promise<void> {
  if (!props.metadata.Id) {
    return;
  }

  loading.value = true;
  images.value =
    (
      await remote.sdk.newUserApi(getRemoteImageApi).getRemoteImages({
        itemId: props.metadata.Id,
        type: type.value,
        providerName: source.value ?? undefined,
        includeAllLanguages: allLanguages.value
      })
    ).data.Images ?? [];

  loading.value = false;
}

/**
 * Handles downloading an image given the image info
 */
async function onDownload(item: RemoteImageInfo): Promise<void> {
  if (!item.Type || !item.Url || !props.metadata.Id) {
    return;
  }

  loading.value = true;
  await remote.sdk.newUserApi(getRemoteImageApi).downloadRemoteImage({
    itemId: props.metadata.Id,
    type: item.Type,
    imageUrl: item.Url
  });
  loading.value = false;

  emit('update:dialog', false);
  emit('download-success', false);
}

/**
 * Resets the image search filters and results
 */
function reset(): void {
  providers.value = [];
  type.value = ImageType.Primary;
  // eslint-disable-next-line unicorn/no-null -- the v-select component uses null to represent no value
  source.value = null;
  allLanguages.value = false;
  images.value = [];
}

watch([type, source, allLanguages], getImages);
watch(
  () => props.dialog,
  (dialog) => {
    if (dialog) {
      getRemoteImageProviders();
      getImages();
    } else {
      reset();
    }
  }
);
</script>

<style lang="scss" scoped>
.loading-bar {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.card-grid-container {
  display: grid;
}

.image-results {
  height: 50vh;
  overflow-y: scroll;
}
</style>
