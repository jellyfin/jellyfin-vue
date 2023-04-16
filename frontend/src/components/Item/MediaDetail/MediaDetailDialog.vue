<template>
  <v-dialog
    content-class="media-detail-dialog"
    :model-value="model"
    :fullscreen="$vuetify.display.mobile"
    @after-leave="emit('close')">
    <v-card v-if="item" height="100%" class="d-flex flex-column media-detail">
      <v-card-title>{{ t('mediaInfo') }}</v-card-title>

      <v-divider />

      <v-card-text
        v-if="mediaSource.length > 0"
        class="d-flex flex-column flex-grow-1">
        <div
          v-for="(media, idx) in mediaSource"
          :key="'mediaInfo' + media.Id!!"
          class="ps-4">
          <media-detail-content
            v-if="
              mediaSourceIndex !== undefined ? mediaSourceIndex === idx : true
            "
            :media="media"
            :parent-name="parentName" />
          <v-divider v-if="idx < mediaSource.length - 1" class="mt-4 mb-2" />
        </div>
      </v-card-text>
      <v-card-text
        v-else
        class="pa-0 flex-grow-1"
        :class="{
          'd-flex': !$vuetify.display.mobile,
          'flex-row': !$vuetify.display.mobile
        }">
        <h2 class="no-media">
          {{ t('NoMediaSourcesAvailable') }}
        </h2>
      </v-card-text>

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
          @click="emit('close')">
          {{ t('close') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  BaseItemDto,
  MediaSourceInfo
} from '@jellyfin/sdk/lib/generated-client';
import { useI18n } from 'vue-i18n';

const props = defineProps<{ item: BaseItemDto; mediaSourceIndex?: number }>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { t } = useI18n();

const model = ref(true);

const parentName = computed<string | undefined>(() => {
  if (mediaSource.value.length > 1) {
    return props.item.Name ?? undefined;
  }
});
const mediaSource = computed<MediaSourceInfo[]>(
  () => props.item.MediaSources || []
);
</script>

<style lang="scss" scoped>
.media-detail-dialog {
  height: 60vh;
}
</style>
