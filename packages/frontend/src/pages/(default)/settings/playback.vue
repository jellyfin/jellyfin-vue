<template>
  <SettingsPage>
    <template #title>
      {{ $t('playback') }}
    </template>

    <template #content>
      <VCol
        cols="12"
        md="8"
        lg="6"
        class="uno-pb-4 uno-pt-0">
        <section class="uno-mb-8">
          <h2 class="uno-text-lg uno-mb-4">
            {{ $t('quality') }}
          </h2>
          <VSelect
            v-model="playbackSettings.quality.value"
            :label="$t('defaultQuality')"
            :items="qualityItems"
            hide-details />
          <dl class="uno-text-sm uno-mt-3 uno-flex uno-flex-col uno-gap-2">
            <div
              v-for="kind in qualityKinds"
              :key="kind.name">
              <dt class="uno-font-medium">
                {{ kind.name }}
              </dt>
              <dd class="uno-opacity-70">
                {{ kind.description }}
              </dd>
            </div>
          </dl>
        </section>

        <section class="uno-mb-8">
          <h2 class="uno-text-lg">
            {{ $t('versions') }}
          </h2>
          <VSwitch
            v-model="autoSelectVersion"
            color="primary"
            hide-details>
            <template #label>
              <div class="uno-py-2">
                <div>{{ $t('autoSelectVersion') }}</div>
                <div class="uno-text-sm uno-opacity-70">
                  {{ $t('autoSelectVersionHelp') }}
                </div>
              </div>
            </template>
          </VSwitch>
        </section>

        <section class="uno-mb-8">
          <h2 class="uno-text-lg">
            {{ $t('hdrVideo') }}
          </h2>
          <VRadioGroup
            v-model="hdrMode"
            color="primary"
            hide-details>
            <VRadio
              v-for="mode in hdrModes"
              :key="mode.value"
              :value="mode.value"
              class="uno-py-2">
              <template #label>
                <div>
                  <div>{{ mode.label }}</div>
                  <div class="uno-text-sm uno-opacity-70">
                    {{ mode.description }}
                  </div>
                </div>
              </template>
            </VRadio>
          </VRadioGroup>
        </section>

        <section class="uno-mb-8">
          <h2 class="uno-text-lg">
            {{ $t('preferredLanguages') }}
          </h2>
          <p class="uno-text-sm uno-mb-4 uno-opacity-70">
            {{ canEditLanguages ? $t('preferredLanguagesHelp') : $t('preferredLanguagesNotAllowed') }}
          </p>
          <div>
            <VAutocomplete
              v-model="languageForm.AudioLanguagePreference"
              variant="outlined"
              :label="$t('preferredAudioLanguage')"
              :items="audioLanguageItems"
              :disabled="languagesDisabled"
              hide-details
              class="uno-mb-2" />
            <VSwitch
              v-model="playDefaultAudioTrack"
              color="primary"
              :disabled="languagesDisabled"
              hide-details
              class="uno-mb-4">
              <template #label>
                <div class="uno-py-2">
                  <div>{{ $t('playDefaultAudioTrack') }}</div>
                  <div class="uno-text-sm uno-opacity-70">
                    {{ $t('playDefaultAudioTrackHelp') }}
                  </div>
                </div>
              </template>
            </VSwitch>
            <VAutocomplete
              v-model="languageForm.SubtitleLanguagePreference"
              variant="outlined"
              :label="$t('preferredSubtitleLanguage')"
              :items="subtitleLanguageItems"
              :disabled="languagesDisabled"
              hide-details
              class="uno-mb-6" />
            <VSelect
              v-model="languageForm.SubtitleMode"
              :label="$t('subtitleMode')"
              :items="subtitleModes"
              :disabled="languagesDisabled"
              hide-details />
            <p class="uno-text-sm uno-mt-2 uno-opacity-70">
              {{ selectedSubtitleModeHelp }}
            </p>
            <!-- Vuetify does not declare click among VBtn's events, so strict templates reject @click -->
            <VBtn
              color="primary"
              variant="flat"
              class="uno-mt-4"
              :block="$vuetify.display.mobile"
              :loading="saving"
              :disabled="!hasLanguageChanges"
              v-on="{ click: saveLanguagePreferences }">
              {{ $t('save') }}
            </VBtn>
          </div>
        </section>

        <section>
          <h2 class="uno-text-lg">
            {{ $t('learnedCompatibility') }}
          </h2>
          <p class="uno-text-sm uno-mb-4 uno-opacity-70">
            {{ $t('learnedCompatibilityHelp') }}
          </p>
          <VBtn
            variant="outlined"
            :block="$vuetify.display.mobile"
            :loading="forgetting"
            v-on="{ click: forget }">
            {{ $t('forgetLearnedCompatibility') }}
          </VBtn>
        </section>
      </VCol>
    </template>
  </SettingsPage>
</template>

<script setup lang="ts">
import {
  SubtitlePlaybackMode,
  type CultureDto,
  type UserConfiguration
} from '@jellyfin/sdk/lib/generated-client';
import { getLocalizationApi } from '@jellyfin/sdk/lib/utils/api/localization-api';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { computed, ref, shallowRef, toRef, watch } from 'vue';
import { useTranslation } from 'i18next-vue';
import { remote } from '#/plugins/remote/index.ts';
import { useSnackbar } from '#/composables/use-snackbar.ts';
import { playbackSettings, type HdrMode } from '#/store/settings/playback.ts';
import { forgetLearnedCompatibility } from '#/store/playback-capabilities.ts';
import { pick } from '#/utils/data-manipulation.ts';
import { selectionModel } from '#/utils/forms.ts';
import { getQualityName } from '#/utils/playback-labels.ts';
import { QUALITY_LADDER } from '#/utils/playback-capabilities/constants.ts';
import type { QualityMenuEntry } from '#/utils/playback-capabilities/quality.ts';

const { t } = useTranslation();

/**
 * == QUALITY, VERSIONS AND HDR (playback settings store) ==
 */
const autoSelectVersion = selectionModel(playbackSettings.autoSelectVersion);
const hdrMode = selectionModel(playbackSettings.hdrMode);
const qualityItems = computed<{ title: string; value: QualityMenuEntry }[]>(() =>
  (['auto', 'original', ...QUALITY_LADDER.map(({ height }) => height)] as const).map(value => ({
    title: getQualityName(t, value),
    value
  }))
);
const qualityKinds = computed(() => [
  { name: t('auto'), description: t('qualityAutoHelp') },
  { name: t('original'), description: t('qualityOriginalHelp') },
  { name: t('fixedResolution'), description: t('qualityFixedHelp') }
]);
const hdrModes = computed<{ value: HdrMode; label: string; description: string }[]>(() => [
  { value: 'browser', label: t('hdrModeBrowser'), description: t('hdrModeBrowserHelp') },
  { value: 'auto', label: t('hdrModeDisplay'), description: t('hdrModeDisplayHelp') }
]);

/**
 * == PREFERRED LANGUAGES (user configuration, stored on the server) ==
 */
const LANGUAGE_KEYS = [
  'AudioLanguagePreference',
  'PlayDefaultAudioTrack',
  'SubtitleLanguagePreference',
  'SubtitleMode'
] as const;

interface LanguagePreferences {
  AudioLanguagePreference: string;
  PlayDefaultAudioTrack: boolean;
  SubtitleLanguagePreference: string;
  SubtitleMode: SubtitlePlaybackMode;
}

/**
 * The value the server uses as audio language preference to play the language the item was made in
 */
const ORIGINAL_LANGUAGE = 'OriginalLanguage';

/**
 * Reads the language preferences of a user configuration. A missing preference is shown as "no preference",
 * and the other members take the server's defaults.
 */
function getLanguagePreferences(config?: UserConfiguration): LanguagePreferences {
  return {
    AudioLanguagePreference: config?.AudioLanguagePreference ?? '',
    PlayDefaultAudioTrack: config?.PlayDefaultAudioTrack ?? true,
    SubtitleLanguagePreference: config?.SubtitleLanguagePreference ?? '',
    SubtitleMode: config?.SubtitleMode ?? SubtitlePlaybackMode.Default
  };
}

/**
 * The configuration the server has, as far as this page knows
 */
const serverConfig = shallowRef(remote.auth.currentUser.value?.Configuration);
const savedLanguages = computed(() => getLanguagePreferences(serverConfig.value));
const languageForm = ref(getLanguagePreferences(serverConfig.value));
const changedLanguageKeys = computed(() =>
  LANGUAGE_KEYS.filter(key => languageForm.value[key] !== savedLanguages.value[key])
);
const hasLanguageChanges = computed(() => changedLanguageKeys.value.length > 0);
/**
 * The server rejects changes to the configuration of users whose policy disables preference access, unless
 * they are administrators
 */
const canEditLanguages = computed(() => {
  const policy = remote.auth.currentUser.value?.Policy;

  return policy?.IsAdministrator === true || policy?.EnableUserPreferenceAccess !== false;
});
const playDefaultAudioTrack = selectionModel(toRef(languageForm.value, 'PlayDefaultAudioTrack'));
const saving = shallowRef(false);
const languagesDisabled = computed(() => saving.value || !serverConfig.value || !canEditLanguages.value);

watch(() => remote.auth.currentUser.value?.Configuration, (config) => {
  serverConfig.value = config;
});

/**
 * The fields the user has not edited follow what the server has, the edited ones are kept
 */
watch(savedLanguages, (saved, previous) => {
  const unedited = LANGUAGE_KEYS.filter(key => languageForm.value[key] === previous[key]);

  Object.assign(languageForm.value, pick(saved, unedited));
});

const cultures = shallowRef<CultureDto[]>([]);

try {
  cultures.value = (await remote.sdk.newUserApi(getLocalizationApi).getCultures()).data;
} catch {
  useSnackbar(t('failedToLoadLanguages'), 'error');
}

/**
 * One entry per language, valued with the three-letter code the server compares with the language of the
 * streams. Regional variants share the code of their language, so only the first culture of each code is kept.
 */
const languageItems = computed(() => {
  const codes = new Set<string>();
  const items: { title: string; value: string }[] = [];

  for (const { DisplayName, ThreeLetterISOLanguageName: code } of cultures.value) {
    if (!code || codes.has(code)) {
      continue;
    }

    codes.add(code);
    items.push({ title: DisplayName ?? code, value: code });
  }

  return items;
});
const audioLanguageItems = computed(() => [
  { title: t('noLanguagePreference'), value: '' },
  { title: t('originalLanguage'), value: ORIGINAL_LANGUAGE },
  ...languageItems.value
]);
const subtitleLanguageItems = computed(() => [
  { title: t('noLanguagePreference'), value: '' },
  ...languageItems.value
]);
const subtitleModes = computed<{ title: string; value: SubtitlePlaybackMode; help: string }[]>(() => [
  { title: t('subtitleModeDefault'), value: SubtitlePlaybackMode.Default, help: t('subtitleModeDefaultHelp') },
  { title: t('subtitleModeSmart'), value: SubtitlePlaybackMode.Smart, help: t('subtitleModeSmartHelp') },
  { title: t('subtitleModeOnlyForced'), value: SubtitlePlaybackMode.OnlyForced, help: t('subtitleModeOnlyForcedHelp') },
  { title: t('subtitleModeAlways'), value: SubtitlePlaybackMode.Always, help: t('subtitleModeAlwaysHelp') },
  { title: t('none'), value: SubtitlePlaybackMode.None, help: t('subtitleModeNoneHelp') }
]);
const selectedSubtitleModeHelp = computed(() =>
  subtitleModes.value.find(mode => mode.value === languageForm.value.SubtitleMode)?.help
);

/**
 * Saves the edited language preferences. The endpoint replaces the whole configuration, so the rest of it is
 * sent as the server has it: it's read right before writing, since other clients may have changed it since the app
 * loaded it. On failure the edits are kept, so they can be saved again.
 */
async function saveLanguagePreferences(): Promise<void> {
  if (languagesDisabled.value || !hasLanguageChanges.value) {
    return;
  }

  const edited = pick(languageForm.value, changedLanguageKeys.value);
  let userConfiguration: UserConfiguration;

  saving.value = true;

  try {
    const { data: user } = await remote.sdk.newUserApi(getUserApi).getCurrentUser();

    userConfiguration = { ...user.Configuration, ...edited };
    await remote.sdk.newUserApi(getUserApi).updateUserConfiguration({
      userId: remote.auth.currentUserId.value,
      userConfiguration
    });
  } catch {
    useSnackbar(t('failedToSaveLanguagePreferences'), 'error');

    return;
  } finally {
    saving.value = false;
  }

  serverConfig.value = userConfiguration;
  useSnackbar(t('saved'), 'success');

  try {
    await remote.auth.refreshCurrentUserInfo();
  } catch {
    // The page already knows what was saved; the rest of the app catches up on the next refresh of the user
  }
}

/**
 * == LEARNED COMPATIBILITY ==
 */
const forgetting = shallowRef(false);

/**
 * Forgets what was learned about what this device plays
 */
async function forget(): Promise<void> {
  forgetting.value = true;

  try {
    await forgetLearnedCompatibility();
    useSnackbar(t('learnedCompatibilityForgotten'), 'success');
  } catch {
    useSnackbar(t('unexpectedError'), 'error');
  } finally {
    forgetting.value = false;
  }
}
</script>
