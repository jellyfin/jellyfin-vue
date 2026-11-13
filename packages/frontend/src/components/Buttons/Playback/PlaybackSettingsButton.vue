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
                  data-quality-menu=""
                  hide-details>
                  <template #selection="{ item }">
                    <span :data-quality-selection="String(item.raw.value)">
                      {{ item.raw.title }}
                      <span
                        v-if="item.raw.subtitle"
                        class="uno-opacity-70"
                        data-running-quality="">
                        · {{ item.raw.subtitle }}
                      </span>
                    </span>
                  </template>
                  <template #item="{ item, props: templateProps }">
                    <VListItem
                      v-bind="templateProps"
                      :title="item.raw.title"
                      :subtitle="item.raw.subtitle"
                      :data-quality-entry="String(item.raw.value)" />
                  </template>
                </VSelect>
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
            <VRow
              v-if="playbackManager.isVideo.value"
              align="center">
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
          <VDivider />
          <VList density="compact">
            <VListItem
              :title="$t('tryAnotherMethod')"
              :subtitle="nextMethodText"
              :disabled="!playbackManager.currentFailureStep.value || !nextMethod"
              :data-next-method="nextMethod ?? ''"
              data-try-another-method=""
              @click="tryAnotherMethod">
              <template #prepend>
                <JIcon class="i-mdi:swap-horizontal uno-mr-4" />
              </template>
            </VListItem>
            <VListItem
              v-if="blockedBy === 'quality'"
              :title="$t('switchToAutomatic')"
              data-switch-to-automatic=""
              @click="switchToAutomatic">
              <template #prepend>
                <JIcon class="i-mdi:auto-mode uno-mr-4" />
              </template>
            </VListItem>
            <VListItem
              :title="$t('playbackStatistics')"
              data-open-playback-statistics=""
              @click="openStatistics">
              <template #prepend>
                <JIcon class="i-mdi:chart-box-outline uno-mr-4" />
              </template>
            </VListItem>
          </VList>
        </VCard>
      </VMenu>
    </VBtn>
  </JTooltip>
  <PlaybackStatistics
    v-if="statisticsOpen"
    @close="statisticsOpen = false" />
</template>

<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import { useTranslation } from 'i18next-vue';
import { isObj, isStr, isUndef } from '@jellyfin-vue/shared/validation';
import { playbackManager } from '#/store/playback-manager.ts';
import { playerElement } from '#/store/player-element.ts';
import { playbackSettings } from '#/store/settings/playback.ts';
import { getQualityMenu, type QualityMenuEntry } from '#/utils/playback-capabilities/quality.ts';
import { getNoOtherMethodText, getPlayingMethodName } from '#/utils/playback-labels.ts';

const menuModel = defineModel<boolean>();
const { t } = useTranslation();
const statisticsOpen = shallowRef(false);

/**
 * The name of a quality menu entry
 */
function getEntryTitle(entry: QualityMenuEntry): string {
  if (entry === 'auto') {
    return t('auto');
  }

  return entry === 'original' ? t('original') : t('qualityLevel', { height: entry });
}

/**
 * The video stream of the version being played that the quality applies to: the one picked or, if none, the first one
 * (as the negotiation takes it), also while nothing plays because of a failure (an unplayable verdict has no video
 * plan). Undefined for music.
 */
const videoStream = computed(() => {
  const streams = playbackManager.currentMediaSource.value?.MediaStreams?.filter(stream => stream.Type === 'Video') ?? [];
  const picked = playbackManager.currentVideoTrack.value?.Index;

  return streams.find(stream => stream.Index === picked) ?? streams[0];
});

/**
 * Automatic, Original and one entry per level available for the file being played (only Automatic and Original for
 * music). Automatic shows, as its subtitle, the entry equivalent to what it is running.
 */
const qualityItems = computed(() => getQualityMenu(videoStream.value).map((entry) => {
  const running = playbackManager.currentRunningQuality.value;

  return {
    title: getEntryTitle(entry),
    subtitle: entry === 'auto' && running !== undefined && quality.value === 'auto' ? getEntryTitle(running) : undefined,
    value: entry
  };
}));

/**
 * The quality the file is played at, written as the preferred quality (the same one the settings page sets).
 * A preferred resolution above the file's own shows as the file's level, which is what it means for this file.
 */
const quality = computed({
  get: (): QualityMenuEntry => {
    const mode = playbackSettings.getQualityMode(videoStream.value);

    return mode.type === 'fixed' ? mode.level : mode.type;
  },
  set: (entry: QualityMenuEntry) => {
    playbackSettings.quality.value = entry;
  }
});

/**
 * The method "try another method" would move to, if any
 */
const nextMethod = computed(() => {
  const step = playbackManager.currentFailureStep.value;

  return step && step.learn !== 'nothing' ? step.next : undefined;
});

/**
 * What forbids the methods after the current one, when one is left on the ladder but none is allowed: the quality mode
 * (Original only allows the original file) or the user policy
 */
const blockedBy = computed(() => {
  const step = playbackManager.currentFailureStep.value;

  return step && step.learn !== 'nothing' && !step.next ? step.blockedBy : undefined;
});

/**
 * The method being used, or why no other one can be tried. The next method isn't named: the verdict skips the rungs
 * the browser can't decode, so the rung after the current one isn't necessarily the one that will be used.
 */
const nextMethodText = computed(() => {
  const current = playbackManager.currentPlaybackMethod.value;
  const verdict = playbackManager.currentVerdict.value;

  if (!nextMethod.value || !current || !verdict) {
    return getNoOtherMethodText(t, blockedBy.value);
  }

  return t('currentPlaybackMethod', { method: getPlayingMethodName(t, verdict, playbackManager.currentMediaSource.value, current) });
});

/**
 * The user says the playback doesn't work (like silent audio, which no engine reports): one rung down the ladder
 */
function tryAnotherMethod(): void {
  menuModel.value = false;
  void playbackManager.reportPlaybackFailure('manual');
}

/**
 * The way out of quality mode Original when it forbids the other methods, as its error notice offers
 */
function switchToAutomatic(): void {
  menuModel.value = false;
  playbackSettings.quality.value = 'auto';
}

/**
 * Opens the playback statistics
 */
function openStatistics(): void {
  menuModel.value = false;
  statisticsOpen.value = true;
}

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
