<template>
  <JTooltip
    :text="$t('playbackSettings')"
    position="top">
    <VBtn
      icon
      class="uno-self-center">
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
                  v-model="quality"
                  density="comfortable"
                  :items="qualityItems"
                  item-title="title"
                  item-value="value"
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
                  @input="playbackManager.currentAudioTrack.value = $event" />
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
                  @input="playbackManager.currentSubtitleTrack.value = $event" />
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
import { playbackManager } from '#/store/playback-manager.ts';
import { playerElement } from '#/store/player-element.ts';
import { playbackSettings } from '#/store/settings/playback.ts';
import { getQualityMenu, type QualityMenuEntry } from '#/utils/playback-capabilities/quality.ts';

const menuModel = defineModel<boolean>();
const { t } = useTranslation();

/**
 * The video stream being played (undefined for music)
 */
const playingVideo = computed(() => {
  const index = playbackManager.currentVerdict.value?.video?.index;

  return playbackManager.currentMediaSource.value?.MediaStreams?.find(
    stream => stream.Type === 'Video' && stream.Index === index
  );
});

/**
 * Automatic, Original and the levels available for the file being played
 */
const qualityItems = computed(() => getQualityMenu(playingVideo.value).map((entry) => {
  let title: string;

  if (entry === 'auto') {
    title = t('auto');
  } else if (entry === 'original') {
    title = t('original');
  } else {
    title = t('qualityLevel', { height: entry });
  }

  return { title, value: entry };
}));

/**
 * The quality the file is played at, written as the preferred quality (the same one the settings page sets).
 * A preferred resolution above the file's own shows as the file's level, which is what it means for this file.
 */
const quality = computed({
  get: (): QualityMenuEntry => {
    const mode = playbackSettings.getQualityMode(playingVideo.value);

    return mode.type === 'fixed' ? mode.level : mode.type;
  },
  set: (entry: QualityMenuEntry) => {
    playbackSettings.quality.value = entry;
  }
});

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
    }

    return _playbackSpeed.value;
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
  if (e) {
    return;
  }

  const playbackSpeedIndex = defaultPlaybackSpeeds.indexOf(playbackManager.playbackSpeed.value);

  if (playbackSpeedIndex !== -1) {
    _playbackSpeed.value = playbackItems.value[playbackSpeedIndex];
  }
}
</script>
