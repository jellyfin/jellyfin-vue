<template>
  <v-container fill-height>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="12" md="12" xl="8">
        <h1 class="text-h4 mb-6 text-center">{{ heading }}</h1>
        <v-stepper v-model="wizardStage" class="transparent-background">
          <v-stepper-header>
            <v-stepper-step
              :complete="wizardStage > 1"
              step="1"
              :editable="maxWizardStage > 0"
            >
              {{ $t('wizard.languageLocale') }}
            </v-stepper-step>

            <v-divider />

            <v-stepper-step
              :complete="wizardStage > 2"
              step="2"
              :editable="maxWizardStage > 1"
            >
              {{ $t('wizard.administratorAccount') }}
            </v-stepper-step>

            <v-divider />

            <v-stepper-step
              :complete="wizardStage > 3"
              step="3"
              :editable="maxWizardStage > 2"
            >
              {{ $t('wizard.preferredMetadataLanguage') }}
            </v-stepper-step>

            <v-divider />

            <v-stepper-step
              :complete="wizardStage > 4"
              step="4"
              :editable="maxWizardStage > 3"
            >
              {{ $t('wizard.remoteAccess') }}
            </v-stepper-step>
          </v-stepper-header>

          <v-stepper-items>
            <v-stepper-content step="1">
              <wizard-language class="pt-4" @step-complete="changeStep" />
            </v-stepper-content>

            <v-stepper-content step="2">
              <wizard-admin-account
                class="pt-4"
                @step-complete="changeStep"
                @previous-step="previousStep"
              />
            </v-stepper-content>

            <v-stepper-content step="3">
              <wizard-metadata
                class="pt-4"
                @step-complete="changeStep"
                @previous-step="previousStep"
              />
            </v-stepper-content>

            <v-stepper-content step="4">
              <wizard-remote-access
                class="pt-4"
                @step-complete="changeStep"
                @previous-step="previousStep"
              />
            </v-stepper-content>
          </v-stepper-items>
        </v-stepper>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions, mapState } from 'vuex';

export default Vue.extend({
  layout: 'fullpage',
  auth: false,
  data() {
    return {
      wizardStage: 1,
      maxWizardStage: 1
    };
  },
  head() {
    return {
      title: this.title
    };
  },
  computed: {
    ...mapState('page', ['title']),
    heading(): string {
      switch (this.wizardStage) {
        case 1:
          return this.$t('wizard.languageLocale');
        case 2:
          return this.$t('wizard.administratorAccount');
        case 3:
          return this.$t('wizard.preferredMetadataLanguage');
        case 4:
          return this.$t('wizard.remoteAccess');
      }

      return '';
    }
  },
  mounted() {
    this.setPageTitle({ title: this.$t('wizard.setupWizard') });
    this.setDeviceProfile();
  },
  methods: {
    ...mapActions('deviceProfile', ['setDeviceProfile']),
    ...mapActions('snackbar', ['pushSnackbarMessage']),
    ...mapActions('page', ['setPageTitle']),
    async completeWizard(): Promise<void> {
      try {
        await this.$api.startup.completeWizard();
        // Redirect to setup complete page
        this.$router.replace('/server/login');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        this.pushSnackbarMessage({
          message: this.$t('wizard.completeError'),
          color: 'success'
        });
      }
    },
    changeStep({ step }: { step: number }): void {
      if (step === 4) {
        this.completeWizard();
      } else {
        this.wizardStage += 1;
      }

      // This allows the return to previous steps, but not going forward past incomplete steps
      if (this.wizardStage > this.maxWizardStage) {
        this.maxWizardStage = this.wizardStage;
      }
    },
    previousStep(): void {
      this.wizardStage -= 1;
    }
  }
});
</script>

<style scoped>
.transparent-background {
  background-color: transparent !important;
}
</style>
