<template>
  <VSelect
    :model-value="currentSource"
    :items="selectSources"
    :label="label"
    :single-line="isNil(label)"
    :messages="currentMessages"
    hide-details="auto"
    class="text-truncate"
    @update:model-value="onSelect">
    <template #selection="{ item: i }">
      {{ i.value.Name }}
    </template>
    <template #item="{ item: i, props, index }">
      <VListItem
        v-bind="props"
        :title="i.value.Name"
        lines="three">
        <template
          v-if="descriptions[index] || index === bestIndex"
          #subtitle>
          <span
            v-if="descriptions[index]"
            class="uno-block">
            {{ descriptions[index] }}
          </span>
          <span
            v-if="index === bestIndex"
            class="uno-text-success uno-block">
            {{ $t('mostCompatibleVersion') }}
          </span>
        </template>
      </VListItem>
    </template>
  </VSelect>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { MediaSourceInfo } from '@jellyfin/sdk/lib/generated-client';
import { useTranslation } from 'i18next-vue';
import { isNil } from '@jellyfin-vue/shared/validation';
import { playbackManager } from '#/store/playback-manager.ts';
import { getItemizedSelect } from '#/utils/forms.ts';
import type { Verdict } from '#/utils/playback-capabilities/verdict.ts';
import { getVerdictLabel, type VerdictLabel } from '#/utils/playback-capabilities/verdict-label.ts';

const { sources, defaultSourceIndex, label, verdicts = [], bestIndex } = defineProps<{
  sources: MediaSourceInfo[];
  /**
   * The version shown: the one the user picked or, while none is picked, the one played when none is chosen. The
   * parent owns the pick (it knows when it stops applying, like when the item changes), so a pick is shown only once
   * the parent passes it back. It may change at any time (for example, when the most compatible version becomes known),
   * and the selector follows it.
   */
  defaultSourceIndex?: number;
  label?: string;
  /**
   * The verdict of each version, in the order of `sources`: how this client would play it
   */
  verdicts?: readonly Verdict[];
  /**
   * Index in `sources` of the version most compatible with this client, which is marked as such
   */
  bestIndex?: number;
}>();

const emit = defineEmits<{
  /**
   * Index (in `sources`) of the version picked by the user. Only emitted on user picks.
   */
  input: [newIndex: number];
}>();

const { t } = useTranslation();

const currentSource = computed(() => sources[defaultSourceIndex ?? 0]);
const selectSources = computed(() => getItemizedSelect(sources));

/**
 * How each version is played: the verdict's prediction or, for the version being played, the method the server
 * actually chose, so what playback learned shows here (not playable, with the reason, when its answer is refused)
 */
const labels = computed(() => sources.map((source, index): VerdictLabel | undefined => {
  const playing = !isNil(source.Id) && source.Id === playbackManager.currentMediaSource.value?.Id;
  const actualMethod = playing ? playbackManager.currentPlaybackMethod.value : undefined;
  const failure = actualMethod ? playbackManager.currentPlaybackFailure.value : undefined;
  const verdict = (actualMethod ? playbackManager.currentVerdict.value : undefined) ?? verdicts[index];

  return verdict ? getVerdictLabel(verdict, source, actualMethod, failure) : undefined;
}));

/**
 * The method in words
 */
function getMethodText(method: VerdictLabel['method']): string {
  switch (method) {
    case 'DirectPlay': {
      return t('playbackMethodDirectPlay');
    }
    case 'Remux': {
      return t('playbackMethodRemux');
    }
    case 'TranscodeAudio': {
      return t('playbackMethodTranscodeAudio');
    }
    case 'TranscodeVideo': {
      return t('playbackMethodTranscodeVideo');
    }
    case 'TranscodeVideoAndAudio': {
      return t('playbackMethodTranscodeVideoAndAudio');
    }
    case 'Unplayable': {
      return t('playbackMethodUnplayable');
    }
  }
}

/**
 * The reason in words
 */
function getReasonText({ reason, values = {} }: VerdictLabel): string | undefined {
  switch (reason) {
    case 'ContainerUnsupported': {
      return t('playbackReasonContainerUnsupported', { container: values.container });
    }
    case 'CodecUnsupported': {
      return t('playbackReasonCodecUnsupported', { codec: values.codec });
    }
    case 'CodecsUnsupported': {
      return t('playbackReasonCodecsUnsupported', { video: values.video, audio: values.audio });
    }
    case 'HdrOnSdrDisplay': {
      return t('playbackReasonHdrOnSdrDisplay');
    }
    case 'SubtitleBurnIn': {
      return t('playbackReasonSubtitleBurnIn');
    }
    case 'ExceedsQuality': {
      return t('playbackReasonExceedsQuality');
    }
    case 'SecondaryAudioTrack': {
      return t('playbackReasonSecondaryAudioTrack');
    }
    case 'ExternalAudioTrack': {
      return t('playbackReasonExternalAudioTrack');
    }
    case 'FailedBefore': {
      return t('playbackReasonFailedBefore');
    }
    case 'NothingWorked': {
      return t('playbackReasonNothingWorked');
    }
    case 'NotSmooth': {
      return t('playbackReasonNotSmooth');
    }
    case 'NotAllowedByQuality': {
      return t('playbackReasonNotAllowedByQuality');
    }
    case 'PolicySimplerMethod': {
      return t('playbackReasonPolicySimplerMethod');
    }
    case 'PolicyNeededMethod': {
      return t('playbackReasonPolicyNeededMethod');
    }
    case 'NoDecodableTarget': {
      return t('playbackReasonNoDecodableTarget');
    }
    case undefined: {
      return undefined;
    }
  }
}

/**
 * The label of each version in words: the method, with its reason when one explains it
 */
const descriptions = computed(() => labels.value.map((verdictLabel) => {
  if (!verdictLabel) {
    return;
  }

  const method = getMethodText(verdictLabel.method);
  const reason = getReasonText(verdictLabel);

  return reason ? t('playbackMethodWithReason', { method, reason }) : method;
}));

/**
 * Shown under the selected version
 */
const currentMessages = computed(() => {
  const index = sources.findIndex(source => source.Id === currentSource.value?.Id);
  const description = descriptions.value[index];

  return [
    ...(description ? [description] : []),
    ...(index !== -1 && index === bestIndex ? [t('mostCompatibleVersion')] : [])
  ];
});

/**
 * Handles the user picking a version: the parent keeps it and passes it back as `defaultSourceIndex`
 */
function onSelect(source: MediaSourceInfo | null | undefined): void {
  if (!source || source.Id === currentSource.value?.Id) {
    return;
  }

  emit('input', sources.findIndex(s => s.Id === source.Id));
}
</script>
