<template>
  <Teleport to="body">
    <aside
      class="uno-text-xs uno-p-3 uno-rounded uno-bg-background/85 uno-w-[min(26rem,calc(100vw-2rem))] uno-shadow-lg uno-left-4 uno-top-4 uno-fixed uno-z-[10000]"
      :aria-label="$t('playbackStatistics')"
      data-playback-statistics=""
      v-bind="dataAttributes">
      <div class="uno-mb-2 uno-flex uno-items-center uno-justify-between">
        <h2 class="uno-text-sm uno-font-medium">
          {{ $t('playbackStatistics') }}
        </h2>
        <button
          type="button"
          class="uno-p-1 uno-flex uno-cursor-pointer hover:uno-opacity-80"
          :aria-label="$t('close')"
          @click="emit('close')">
          <JIcon class="i-mdi:close" />
        </button>
      </div>
      <dl class="uno-font-mono uno-gap-x-3 uno-gap-y-1 uno-grid uno-grid-cols-[auto_1fr]">
        <template
          v-for="row in rows"
          :key="row.label">
          <dt class="uno-opacity-70">
            {{ row.label }}
          </dt>
          <dd class="uno-break-all">
            {{ row.value }}
          </dd>
        </template>
      </dl>
      <VSwitch
        v-model="methodChangeNotices"
        class="uno-mt-2"
        color="primary"
        density="compact"
        hide-details
        data-method-change-notices-switch=""
        :label="$t('methodChangeNotices')" />
    </aside>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import i18next from 'i18next';
import { useTranslation } from 'i18next-vue';
import { playbackManager } from '#/store/playback-manager.ts';
import { playbackObservations, sessionNetworkEstimate, type PlayingStreamInfo } from '#/store/playback-quality.ts';
import { playbackSettings } from '#/store/settings/playback.ts';
import { selectionModel } from '#/utils/forms.ts';
import { getModeLevel } from '#/utils/playback-capabilities/quality.ts';
import { getPlaybackChangeReasonName, getPlaybackMethodName, getPlayingMethodName, getPredictedMethodName, getQualityName } from '#/utils/playback-labels.ts';

const emit = defineEmits<{ close: [] }>();
const { t } = useTranslation();

/**
 * The notices setting, bound to the switch
 */
const methodChangeNotices = selectionModel(playbackSettings.methodChangeNotices);

/**
 * The container and codec strings of what the element is fed: the stream hls.js buffers, or the file played
 * directly (as the verdict asked the browser about it: one content type per stream). When the element plays the
 * server's HLS output natively (or before hls.js read it), only its container is known: the server chooses its codecs
 * among the requested ones.
 */
const stream = computed<PlayingStreamInfo>(() => {
  const hlsStream = playbackObservations.hlsStream.value;
  const method = playbackManager.currentPlaybackMethod.value;

  if (method !== undefined && method !== 'DirectPlay') {
    return hlsStream ?? { container: playbackManager.currentNegotiatedMediaSource.value?.TranscodingContainer ?? undefined };
  }

  const codecs = playbackManager.currentVerdict.value?.codecs;

  return {
    container: playbackManager.currentNegotiatedMediaSource.value?.Container ?? undefined,
    video: codecs?.video,
    audio: codecs?.audio
  };
});

const mode = computed(() => playbackManager.currentQualityMode.value);
const level = computed(() => mode.value ? getModeLevel(mode.value) : undefined);
const modeName = computed(() => {
  if (!mode.value) {
    return '—';
  }

  return getQualityName(t, mode.value.type === 'fixed' ? mode.value.level : mode.value.type);
});
const lastChange = computed(() => playbackObservations.lastChange.value);
const frames = computed(() => playbackObservations.frames.value);
const size = computed(() => playbackObservations.videoSize.value);
const bufferAhead = computed(() => playbackObservations.bufferAhead.value);
const estimate = computed(() => sessionNetworkEstimate.value);

/**
 * The last change of method or quality, with its reason
 */
const lastChangeText = computed(() => {
  const change = lastChange.value;

  if (!change) {
    return '—';
  }

  const reason = getPlaybackChangeReasonName(t, change.reason);

  return change.kind === 'method'
    ? `${getPlaybackMethodName(t, change.from)} → ${getPlaybackMethodName(t, change.to)} (${reason})`
    : `${getQualityName(t, change.from)} → ${getQualityName(t, change.to)} (${reason})`;
});

/**
 * The method the server uses (not playable, with the reason, when its answer is refused) and the one the verdict
 * predicted (said to be an attempt when it was one), in the version selector's words
 */
const playingMethodName = computed(() => {
  const verdict = playbackManager.currentVerdict.value;
  const method = playbackManager.currentPlaybackMethod.value;

  return verdict && method
    ? getPlayingMethodName(t, verdict, playbackManager.currentMediaSource.value, method, playbackManager.currentPlaybackFailure.value)
    : '—';
});
const predictedMethodName = computed(() => {
  const verdict = playbackManager.currentVerdict.value;

  return verdict ? getPredictedMethodName(t, verdict, playbackManager.currentMediaSource.value) : '—';
});

/**
 * A number with its unit, in the language of the app
 */
function formatUnit(value: number, unit: string, fractionDigits: number): string {
  return new Intl.NumberFormat(i18next.language, {
    style: 'unit',
    unit,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(value);
}

const rows = computed(() => [
  {
    label: t('playbackMethod'),
    value: t('playbackMethodWithPrediction', { method: playingMethodName.value, predicted: predictedMethodName.value })
  },
  { label: t('mediaInfoFileContainer'), value: stream.value.container ?? '—' },
  { label: t('video'), value: stream.value.video ?? '—' },
  { label: t('audio'), value: stream.value.audio ?? '—' },
  { label: t('mediaInfoVideoResolution'), value: size.value ? `${size.value.width}×${size.value.height}` : '—' },
  {
    label: t('quality'),
    value: [
      modeName.value,
      playbackManager.currentRunningQuality.value === undefined ? undefined : getQualityName(t, playbackManager.currentRunningQuality.value)
    ].filter(Boolean).join(' · ')
  },
  { label: t('droppedFrames'), value: frames.value ? `${frames.value.dropped} / ${frames.value.total}` : '—' },
  { label: t('networkEstimate'), value: estimate.value === undefined ? '—' : formatUnit(estimate.value / 1_000_000, 'megabit-per-second', 2) },
  { label: t('bufferHealth'), value: bufferAhead.value === undefined ? '—' : formatUnit(bufferAhead.value, 'second', 1) },
  { label: t('bufferingStalls'), value: String(playbackObservations.stalls.value) },
  {
    label: t('lastPlaybackChange'),
    value: lastChangeText.value
  }
]);

/**
 * The same values as plain `data-*` attributes, so end-to-end tests can read them
 */
const dataAttributes = computed<Record<`data-${string}`, string>>(() => {
  const values: Record<string, string | number | undefined> = {
    method: playbackManager.currentPlaybackMethod.value,
    failure: playbackManager.currentPlaybackFailure.value,
    predictedMethod: playbackManager.currentVerdict.value?.method,
    predictedUnverified: playbackManager.currentVerdict.value && String(playbackManager.currentVerdict.value.unverified),
    container: stream.value.container,
    videoCodec: stream.value.video,
    audioCodec: stream.value.audio,
    width: size.value?.width,
    height: size.value?.height,
    qualityMode: mode.value?.type,
    qualityLevel: level.value,
    runningQuality: playbackManager.currentRunningQuality.value,
    droppedFrames: frames.value?.dropped,
    totalFrames: frames.value?.total,
    bandwidth: estimate.value === undefined ? undefined : Math.round(estimate.value),
    bufferAhead: bufferAhead.value?.toFixed(2),
    stalls: playbackObservations.stalls.value,
    lastChangeKind: lastChange.value?.kind,
    lastChangeReason: lastChange.value?.reason,
    lastChangeFrom: lastChange.value?.from,
    lastChangeTo: lastChange.value?.to,
    methodChangeNotices: String(playbackSettings.methodChangeNotices.value)
  };

  return Object.fromEntries(Object.entries(values).map(([name, value]) => [
    'data-' + name.replaceAll(/[A-Z]/g, letter => '-' + letter.toLowerCase()),
    value === undefined ? '' : String(value)
  ]));
});
</script>
