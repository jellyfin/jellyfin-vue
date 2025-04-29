<template>
  <JTooltip
    :text="$t('playbackSettings')"
    position="top">
    <VBtn
      icon
      class="align-self-center">
      <JIcon class="i-mdi:cog" />
      <VMenu
        v-model="menuModel"
        :close-on-content-click="false"
        :transition="'slide-y-transition'"
        location="top">
        <VCard min-width="300">
          <VCardText>
            <VRow align="center">
              <VCol :cols="4">
                <label>{{ $t('quality') }}</label>
              </VCol>
              <VCol :cols="8">
                <VSelect
                  density="comfortable"

                  disabled
                  hide-details />
              </VCol>
            </VRow>
            <VRow align="center">
              <VCol :cols="4">
                <label>{{ $t('audio') }}</label>
              </VCol>
              <VCol :cols="8">
                <MediaStreamSelector
                  v-if="playbackManager.currentItemAudioTracks.value"
                  :media-streams="playbackManager.currentItemAudioTracks.value"
                  type="Audio"
                  :default-stream-index="playbackManager.currentAudioTrack.value?.Index"
                  @input="playbackManager.currentAudioTrack.value = $event ?? -1" />
              </VCol>
            </VRow>
            <VRow
              v-if="!$vuetify.display.smAndUp"
              align="center">
              <VCol :cols="4">
                <label>{{ $t('subtitles') }}</label>
              </VCol>
              <VCol :cols="8">
                <MediaStreamSelector
                  v-if="playbackManager.currentItemSubtitleTracks.value"
                  :media-streams="playbackManager.currentItemSubtitleTracks.value"
                  type="Subtitle"
                  :default-stream-index="
                    playbackManager.currentSubtitleTrack.value?.Index
                  "
                  @input="playbackManager.currentSubtitleTrack.value = $event ?? -1" />
              </VCol>
            </VRow>
            <VRow align="center">
              <VCol :cols="4">
                <label>{{ $t('speed') }}</label>
              </VCol>
              <VCol :cols="8">
                <VCombobox
                  v-model="playbackSpeed"
                  density="comfortable"
                  :items="playbackItems"
                  item-title="title"
                  item-value="speed"
                  :prefix
                  :rules="validationRules"
                  @update:focused="onFocus" />
              </VCol>
            </VRow>
            <VRow align="center">
              <VCol :cols="4">
                <label>{{ $t('stretch') }}</label>
              </VCol>
              <VCol
                :cols="8"
                class="text-right">
                <VSwitch
                  v-model="playerElement.state.value.isStretched"
                  color="primary"
                  hide-details />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VMenu>
    </VBtn>
  </JTooltip>
</template>

<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import { useTranslation } from 'i18next-vue';
import { isObj, isStr, isUndef } from '@jellyfin-vue/shared/validation';
import { playbackManager } from '#/store/playback-manager';
import { playerElement } from '#/store/player-element';

const menuModel = defineModel<boolean>();
const { t } = useTranslation();
const defaultPlaybackSpeeds = Object.freeze([0.5, 0.75, 1, 1.25, 1.5, 2]);
const playbackItems = computed(() => defaultPlaybackSpeeds.map(speed => ({
  title: speed === 1 ? t('normal') : String(speed),
  speed
})));

type PlaybackSpeedValue = string | typeof playbackItems.value[number] | null;

const _playbackSpeed = shallowRef<PlaybackSpeedValue>();
const playbackSpeed = computed({
  get: () => {
    const playbackSpeedIndex = defaultPlaybackSpeeds.indexOf(playbackManager.playbackSpeed.value);

    if (isUndef(_playbackSpeed.value)) {
      return playbackSpeedIndex === -1 ? String(playbackManager.playbackSpeed.value) : playbackItems.value[playbackSpeedIndex];
    } else {
      return _playbackSpeed.value;
    }
  },
  set: (val: PlaybackSpeedValue) => {
    _playbackSpeed.value = val;

    if (validationRules.every(rule => rule(val) === true)) {
      playbackManager.playbackSpeed.value = isObj(val) ? val.speed : Number(val);
    }
  }
});
const prefix = computed(() => isObj(playbackSpeed.value) && playbackSpeed.value.speed === 1 ? undefined : 'x');

const validationRules = [
  (val: PlaybackSpeedValue): true | string => isObj(val) || isStr(val) || t('required'),
  (val: PlaybackSpeedValue): true | string => isObj(val) || (isStr(val) && !Number.isNaN(Number(val))) || t('mustBeNumber'),
  (val: PlaybackSpeedValue): true | string => {
    const num_val = isObj(val) ? val.speed : Number(val);

    /**
     * Chromium ranges:
     * https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/core/html/media/html_media_element.cc
     */
    return (num_val >= 0.0625 && num_val <= 16) || t('mustBeInRange', { min: 0.0625, max: 16 });
  }
];

/**
 * Set one of the objects on Combobox's blur
 */
function onFocus(e: boolean): void {
  if (!e) {
    const playbackSpeedIndex = defaultPlaybackSpeeds.indexOf(playbackManager.playbackSpeed.value);

    if (playbackSpeedIndex !== -1) {
      _playbackSpeed.value = playbackItems.value[playbackSpeedIndex];
    }
  }
}
</script>
