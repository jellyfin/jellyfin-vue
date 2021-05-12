<template>
  <validation-observer v-slot="{ invalid }">
    <v-form v-model="validInputs">
      <validation-provider v-slot="{ errors }" name="username" rules="required">
        <v-text-field
          v-model="admin.Name"
          outlined
          :label="$t('username')"
          type="username"
          :error-messages="errors"
          required
        />
      </validation-provider>
      <validation-provider
        v-slot="{ errors }"
        rules="bothPasswordsSame:@confirm"
      >
        <v-text-field
          v-model="admin.Password"
          outlined
          :label="$t('password')"
          :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          :type="showPassword ? 'text' : 'password'"
          :error-messages="errors"
          @click:append="() => (showPassword = !showPassword)"
        />
      </validation-provider>

      <validation-provider v-slot="{ errors }" name="confirm" rules="">
        <v-text-field
          v-model="passwordCheck"
          outlined
          :label="$t('wizard.confirmPassword')"
          :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          :type="showPassword ? 'text' : 'password'"
          :error-messages="errors"
          @click:append="() => (showPassword = !showPassword)"
        />
      </validation-provider>

      <v-btn color="secondary" @click="$emit('previous-step', { step: 2 })">
        {{ $t('previous') }}
      </v-btn>
      <v-btn
        color="primary"
        :disabled="invalid"
        :loading="loading"
        @click="createAdminAccount"
      >
        {{ $t('next') }}
      </v-btn>
    </v-form>
  </validation-observer>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions, mapState } from 'vuex';

export default Vue.extend({
  data() {
    return {
      admin: {
        Name: '',
        Password: ''
      },
      passwordCheck: '',
      showPassword: false,
      loading: false
    };
  },
  computed: {
    ...mapState('deviceProfile', [
      'clientName',
      'deviceId',
      'clientVersion',
      'deviceName'
    ])
  },
  methods: {
    ...mapActions('snackbar', ['pushSnackbarMessage']),
    async createAdminAccount(): Promise<void> {
      this.loading = true;

      try {
        const token = `MediaBrowser Client="${this.clientName}", Device="${this.deviceName}", DeviceId="${this.deviceId}", Version="${this.clientVersion}"`;

        this.$auth.ctx.app.$axios.setHeader('X-Emby-Authorization', token);

        await this.$api.startup.updateStartupUser({
          uNKNOWNBASETYPE: this.admin
        });

        this.$emit('step-complete', { step: 2 });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        this.pushSnackbarMessage({
          message: this.$t('wizard.setAdminError'),
          color: 'error'
        });
      }

      this.loading = false;
    }
  }
});
</script>
