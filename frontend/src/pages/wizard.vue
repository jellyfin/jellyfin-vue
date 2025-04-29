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
        <VStepper
          v-model="wizardStage"
          class="transparent-background">
          <VStepperHeader>
            <VStepperItem
              :complete="wizardStage > 1"
              :value="1"
              :editable="maxWizardStage > 0">
              {{ t('languageLocale') }}
            </VStepperItem>

            <VDivider />

            <VStepperItem
              :complete="wizardStage > 2"
              :value="2"
              :editable="maxWizardStage > 1">
              {{ t('administratorAccount') }}
            </VStepperItem>

            <VDivider />

            <VStepperItem
              :complete="wizardStage > 3"
              :value="3"
              :editable="maxWizardStage > 2">
              {{ t('preferredMetadataLanguage') }}
            </VStepperItem>

            <VDivider />

            <VStepperItem
              :complete="wizardStage > 4"
              :value="4"
              :editable="maxWizardStage > 3">
              {{ t('remoteAccess') }}
            </VStepperItem>
          </VStepperHeader>

          <VStepperWindow>
            <VStepperWindowItem
              key="1-content"
              :value="1">
              <WizardLanguage
                class="pt-4"
                @step-complete="nextStep" />
            </VStepperWindowItem>

            <VStepperWindowItem
              key="2-content"
              :value="2">
              <WizardAdminAccount
                class="pt-4"
                @step-complete="nextStep"
                @previous-step="previousStep" />
            </VStepperWindowItem>

            <VStepperWindowItem
              key="3-content"
              :value="3">
              <WizardMetadata
                class="pt-4"
                @step-complete="nextStep"
                @previous-step="previousStep" />
            </VStepperWindowItem>

            <VStepperWindowItem
              key="4-content"
              :value="4">
              <WizardRemoteAccess
                class="pt-4"
                @step-complete="nextStep"
                @previous-step="previousStep" />
            </VStepperWindowItem>
          </VStepperWindow>
        </VStepper>
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
import { ref } from 'vue';
import { useTranslation } from 'i18next-vue';
import { useRouter } from 'vue-router';
import { useSnackbar } from '#/composables/use-snackbar';
import { remote } from '#/plugins/remote';

const { t } = useTranslation();
const router = useRouter();

const wizardStage = ref(1);
const maxWizardStage = ref(1);

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
