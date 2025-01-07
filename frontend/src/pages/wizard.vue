<template>
  <VContainer
    class="fill-height"
    fluid>
    <VRow justify="center">
      <VCol
        cols="12"
        sm="12"
        md="12"
        xl="8">
        <v-stepper v-model="wizardStage" class="transparent-background">
          <v-stepper-header>
            <v-stepper-item
              :complete="wizardStage > 1"
              value="1"
              :editable="maxWizardStage > 0">
              {{ t('languageLocale') }}
            </v-stepper-item>

            <v-divider />

            <v-stepper-item
              :complete="wizardStage > 2"
              value="2"
              :editable="maxWizardStage > 1">
              {{ t('administratorAccount') }}
            </v-stepper-item>

            <v-divider />

            <v-stepper-item
              :complete="wizardStage > 3"
              value="3"
              :editable="maxWizardStage > 2">
              {{ t('preferredMetadataLanguage') }}
            </v-stepper-item>

            <v-divider />

            <v-stepper-item
              :complete="wizardStage > 4"
              value="4"
              :editable="maxWizardStage > 3">
              {{ t('remoteAccess') }}
            </v-stepper-item>
          </v-stepper-header>

          <v-stepper-window>
            <v-stepper-window-item 
              key="1-content"
              value="1">
              <wizard-language class="pt-4" @step-complete="nextStep" />
            </v-stepper-window-item>

            <v-stepper-window-item 
              key="2-content"
              value="2">
              <wizard-admin-account
                class="pt-4"
                @step-complete="nextStep"
                @previous-step="previousStep" />
            </v-stepper-window-item>

            <v-stepper-window-item 
              key="3-content"
              value="3">
              <wizard-metadata
                class="pt-4"
                @step-complete="nextStep"
                @previous-step="previousStep" />
            </v-stepper-window-item>

            <v-stepper-window-item 
              key="4-content"
              value="4">
              <wizard-remote-access
                class="pt-4"
                @step-complete="nextStep"
                @previous-step="previousStep" />
            </v-stepper-window-item>
          </v-stepper-window>
        </v-stepper>
      </VCol>
    </VRow>
  </VContainer>
</template>

<route lang="yaml">
meta:
  layout:
    name: server
</route>

<script setup lang="ts">
import { getStartupApi } from '@jellyfin/sdk/lib/utils/api/startup-api';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useSnackbar } from '@/composables/use-snackbar';
import { remote } from '@/plugins/remote';

const { t } = useI18n();
const router = useRouter();

const wizardStage = ref(1);
const maxWizardStage = ref(1);

const heading = computed(() => {
  switch (wizardStage.value) {
    case 1: {
      return t('languageLocale');
    }
    case 2: {
      return t('administratorAccount');
    }
    case 3: {
      return t('preferredMetadataLanguage');
    }
    case 4: {
      return t('remoteAccess');
    }
  }

  return '';
});

/**
 * Completes server setup
 */
async function completeWizard(): Promise<void> {
  try {
    const api = remote.sdk.oneTimeSetup(
      remote.auth.currentServer.value?.PublicAddress ?? ''
    );

    await getStartupApi(api).completeWizard();
    // Redirect to setup complete page
    await router.replace('/server/login');
  } catch (error) {
    console.error(error);
    useSnackbar(t('completeError'), 'success');
  }
}

/**
 * Change wizard step forward
 */
async function nextStep(): Promise<void> {
  if (wizardStage.value === 4) {
    await completeWizard();
  } else {
    wizardStage.value += 1;
  }

  // This allows the return to previous steps, but not going forward past incomplete steps
  if (wizardStage.value > maxWizardStage.value) {
    maxWizardStage.value = wizardStage.value;
  }
}

/**
 * Change wizard step backwards
 */
function previousStep(): void {
  wizardStage.value -= 1;
}
</script>

<style scoped>
.transparent-background {
  background-color: transparent !important;
}
</style>
