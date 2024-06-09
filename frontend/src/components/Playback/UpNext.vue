<template>
  <VContainer
    v-if="visible && playbackManager.currentItem && playbackManager.nextItem"
    class="up-next-dialog uno-pointer-events-none pa-lg-6">
    <VRow>
      <VCol
        cols="12"
        offset-md="6"
        md="6"
        offset-lg="8"
        lg="4"
        offset-xl="9"
        xl="3">
        <VCard>
          <VCardTitle class="text-h6">
            <span>
              {{ $t('nextItemPlayingIn') }}
              <span class="text-primary darken-2">
                {{ $t('seconds', currentItemTimeLeft) }}
              </span>
            </span>
          </VCardTitle>
          <VCardSubtitle class="text-truncate text-subtitle-1">
            <span v-if="playbackManager.currentItem.Type === 'Episode'">
              {{ playbackManager.nextItem.SeriesName }} -
              {{
                $t('seasonEpisodeAbbrev', {
                  seasonNumber: playbackManager.nextItem.ParentIndexNumber,
                  episodeNumber: playbackManager.nextItem.IndexNumber
                })
              }}
              <span v-if="$vuetify.display.smAndUp"> - </span>
              <br v-else>
              {{ playbackManager.nextItem.Name }}
            </span>
            <span v-if="playbackManager.currentItem.Type === 'Movie'">
              {{ playbackManager.nextItem.Name }}
            </span>
          </VCardSubtitle>
          <VCardText v-if="playbackManager.nextItem?.RunTimeTicks">
            <span>
              {{ getRuntimeTime(playbackManager.nextItem.RunTimeTicks) }}
              <span class="pl-4">
                {{
                  $t('endsAt', {
                    time: getEndsAtTime(playbackManager.nextItem.RunTimeTicks).value
                  })
                }}
              </span>
            </span>
          </VCardText>
          <VCardActions>
            <VSpacer />
            <VBtn
              class="bg-primary-darken-2"
              variant="flat"
              @click="playbackManager.setNextItem">
              {{ $t('startNow') }}
            </VBtn>
            <VBtn @click="isHiddenByUser = true">
              {{ $t('hide') }}
            </VBtn>
          </VCardActions>
        </VCard>
      </VCol>
    </VRow>
  </VContainer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { playbackManager } from '@/store/playback-manager';
import { getEndsAtTime, getRuntimeTime } from '@/utils/time';

const emit = defineEmits<{
  change: [isVisible: boolean];
}>();

const isHiddenByUser = ref(false);

const currentItemDuration = computed(
  () => playbackManager.currentItemRuntime / 1000
);
const currentItemTimeLeft = computed(() =>
  Math.round(currentItemDuration.value - (playbackManager.currentTime || 0))
);
const nextUpDuration = computed(() => {
  /**
   * - If longer than 5 hours, set the duration to 9 minutes
   * - If longer than 2 hours, set the duration to 3.5 minutes
   * - If longer than 45 minutes, set the duration to 2 minutes
   */
  if (currentItemDuration.value >= 5 * 60 * 60) {
    return 540;
  } else if (currentItemDuration.value >= 2 * 60 * 60) {
    return 210;
  } else if (currentItemDuration.value >= 45 * 60) {
    return 120;
  }

  return 45;
});
const visible = computed(
  () =>
    !isHiddenByUser.value
    && playbackManager.isVideo
    && currentItemTimeLeft.value <= nextUpDuration.value
);

watch(
  () => playbackManager.currentItemIndex,
  () => {
    isHiddenByUser.value = false;
  }
);
watch(visible, () => { emit('change', visible.value); });
</script>
<style scoped>
.up-next-dialog {
  position: absolute;
  bottom: 0;
  right: 0;
  z-index: 9999;
}
</style>
