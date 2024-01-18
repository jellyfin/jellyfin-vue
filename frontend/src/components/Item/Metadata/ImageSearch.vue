<template>
  <VDialog
    :model-value="dialog"
    :fullscreen="$vuetify.display.mobile"
    content-class="image-search-dialog-content"
    @update:model-value="(value: boolean) => emit('update:dialog', value)">
    <VCard
      height="100%"
      class="image-search-card">
      <VCardTitle>{{ t('search') }}</VCardTitle>
      <VDivider />
      <VRow
        align="center"
        class="mx-16 my-4">
        <VSelect
          v-model="source"
          class="mx-4"
          :items="sources"
          :disabled="loading"
          :label="t('source')"
          :placeholder="t('all')"
          persistent-placeholder
          variant="outlined"
          hide-details
          clearable />
        <VSelect
          v-model="type"
          class="mx-4"
          :items="types"
          item-title="text"
          item-value="value"
          :disabled="loading"
          :label="t('type')"
          variant="outlined"
          hide-details />
        <VCheckbox
          v-model="allLanguages"
          class="mt-0 mx-4"
          :label="t('allLanguages')"
          :disabled="loading"
          hide-details />
      </VRow>
      <VDivider />
      <VProgressCircular
        v-if="loading"
        :size="70"
        :width="7"
        color="primary"
        indeterminate
        class="loading-bar" />
      <VCard
        v-else-if="images.length === 0"
        class="mx-auto">
        <VCardTitle>
          {{ t('noImagesFound') }}
        </VCardTitle>
      </VCard>
      <VRow
        v-else
        class="image-results">
        <VCol
          v-for="(item, i) in images"
          :key="`${item.Type}-${i}`"
          xl="1"
          lg="3"
          md="4"
          sm="6"
          cols="12">
          <VCard class="ma-2">
            <VImg
              v-if="item.Url"
              :src="item.Url"
              :aspect-ratio="getContainerAspectRatioForImageType(item.Type)" />
            <div class="text-center text-truncate text-subtitle-1 mt-2">
              {{ item.ProviderName }}
            </div>
            <div
              v-if="item.Width && item.Height"
              class="text-center text-body-2 text-grey-darken-2 info-box">
              {{ t('dimensions', { width: item.Width, height: item.Height }) }}
            </div>
            <div
              v-if="item.Language"
              class="text-center text-body-2 text-grey-darken-2 info-box">
              <b>{{ `${t("language")}: ` }}</b>{{ getLocaleName(item.Language) }}
            </div>
            <div
              v-if="item.CommunityRating"
              class="text-center text-body-2 text-grey-darken-2 info-box">
              <b>{{ `${t("communityRating")}: ` }}</b>{{ item.CommunityRating.toFixed(1) }}
            </div>
            <div class="text-center text-body-2 text-grey-darken-2 info-box">
              <template v-if="item.VoteCount">
                {{ t('imageVotes', { votes: item.VoteCount }) }}
              </template>
            </div>
            <VSpacer />
            <VCardActions class="justify-center">
              <VBtn
                icon
                :disabled="loading"
                @click="onDownload(item)">
                <VIcon>
                  <IMdiCloudDownload />
                </VIcon>
              </VBtn>
            </VCardActions>
          </VCard>
        </VCol>
      </VRow>
    </VCard>
  </VDialog>
</template>

<script setup lang="ts">
import {
  type BaseItemDto,
  type ImageProviderInfo,
  ImageType,
  type RemoteImageInfo
} from '@jellyfin/sdk/lib/generated-client';
import { getRemoteImageApi } from '@jellyfin/sdk/lib/utils/api/remote-image-api';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { getContainerAspectRatioForImageType } from '@/utils/images';
import { getLocaleName } from '@/utils/i18n';
import { remote } from '@/plugins/remote';

const props = defineProps<{
  metadata: BaseItemDto;
  dialog: boolean;
}>();

const emit = defineEmits<{
  'update:dialog': [isOpen: boolean];
  'download-success': [someting: boolean];
}>();

const { t } = useI18n();

const providers = ref<ImageProviderInfo[]>([]);
const type = ref<ImageType>(ImageType.Primary);
const source = ref<ImageProviderInfo['Name']>();
const allLanguages = ref(false);
const images = ref<RemoteImageInfo[]>([]);
const loading = ref(false);

const types = computed(() => [
  {
    value: ImageType.Primary,
    text: t('primary')
  },
  {
    value: ImageType.Art,
    text: t('art')
  },
  {
    value: ImageType.Backdrop,
    text: t('backdrop')
  },
  {
    value: ImageType.Banner,
    text: t('banner')
  },
  {
    value: ImageType.Box,
    text: t('box')
  },
  {
    value: ImageType.BoxRear,
    text: t('boxRear')
  },
  {
    value: ImageType.Disc,
    text: t('disc')
  },
  {
    value: ImageType.Logo,
    text: t('logo')
  },
  {
    value: ImageType.Menu,
    text: t('menu')
  },
  {
    value: ImageType.Screenshot,
    text: t('screenshot')
  },
  {
    value: ImageType.Thumb,
    text: t('thumb')
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
  source.value = undefined;
  allLanguages.value = false;
  images.value = [];
}

watch([type, source, allLanguages], getImages);
watch(
  () => props.dialog,
  async (dialog) => {
    if (dialog) {
      await getRemoteImageProviders();
      await getImages();
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
