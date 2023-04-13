<template>
  <v-card v-if="itemId" height="100%" class="d-flex flex-column media-detail">
    <v-card-title>{{ t('mediaInfo.title') }}</v-card-title>

    <v-divider />

    <v-card-text
      v-if="mediaSource.length > 0"
      class="pa-0 flex-grow-1"
      :class="{
        'd-flex': !$vuetify.display.mobile,
        'flex-row': !$vuetify.display.mobile
      }">
      <div
        v-for="media in mediaSource"
        :key="'mediaInfo' + media.Id!!"
        class="ps-4">
        <media-detail-content :media="media" />
      </div>
    </v-card-text>
    <v-card-text
      v-else-if="mediaSource.length === 0 && !isLoading"
      class="pa-0 flex-grow-1"
      :class="{
        'd-flex': !$vuetify.display.mobile,
        'flex-row': !$vuetify.display.mobile
      }">
      <h2 class="no-media">
        {{ t('mediaInfo.noMediaSources') }}
      </h2>
    </v-card-text>

    <v-card-actions
      class="d-flex align-center pa-3"
      :class="{
        'justify-end': !$vuetify.display.mobile,
        'justify-center': $vuetify.display.mobile
      }">
      <v-btn variant="flat" width="8em" color="secondary" @click="emit('hide')">
        {{ t('close') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { useI18n } from 'vue-i18n';
import { useRemote } from '@/composables';

const props = defineProps<{
  itemId: string;
}>();

const emit = defineEmits<{
  (e: 'hide'): void;
}>();

const { t } = useI18n();
const remote = useRemote();

const isLoading = ref(true);
const mediaSource = ref<MediaSourceInfo[]>([]);

/**
 * Fetches the item data from the server
 */
async function getData(): Promise<void> {
  console.info('Fetching item data for', props.itemId);

  const itemInfo = (
    await remote.sdk.newUserApi(getUserLibraryApi).getItem({
      userId: remote.auth.currentUserId ?? '',
      itemId: props.itemId
    })
  ).data;

  mediaSource.value = itemInfo.MediaSources || [];
  isLoading.value = false;
}

console.info('Attached MediaDetail component to', props.itemId);
watch(() => props.itemId, getData, { immediate: true });
</script>

<style lang="scss" scoped>
.no-media {
  display: block;
  margin-left: 1rem;
  margin-top: 1rem;
}
</style>
