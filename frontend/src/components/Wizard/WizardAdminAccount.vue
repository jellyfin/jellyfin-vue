<template>
  <validation-observer v-slot="{ invalid }">
    <v-form v-model="validInputs">
      <validation-provider v-slot="{ errors }" name="username" rules="required">
        <v-text-field
          v-model="admin.Name"
          variant="outlined"
          :label="$t('username')"
          type="username"
          :error-messages="errors"
          required />
      </validation-provider>
      <validation-provider
        v-slot="{ errors }"
        rules="bothPasswordsSame:@confirm">
        <v-text-field
          v-model="admin.Password"
          variant="outlined"
          :label="$t('password')"
          :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          :type="showPassword ? 'text' : 'password'"
          :error-messages="errors"
          @click:append="() => (showPassword = !showPassword)" />
      </validation-provider>

      <validation-provider v-slot="{ errors }" name="confirm" rules="">
        <v-text-field
          v-model="passwordCheck"
          variant="outlined"
          :label="$t('wizard.confirmPassword')"
          :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          :type="showPassword ? 'text' : 'password'"
          :error-messages="errors"
          @click:append="() => (showPassword = !showPassword)" />
      </validation-provider>

      <v-btn color="secondary" @click="$emit('previous-step', { step: 2 })">
        {{ $t('previous') }}
      </v-btn>
      <v-btn
        color="primary"
        :disabled="invalid"
        :loading="loading"
        @click="createAdminAccount">
        {{ $t('next') }}
      </v-btn>
    </v-form>
  </validation-observer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapStores } from 'pinia';
import { authStore, snackbarStore } from '~/store';

export default defineComponent({
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
    ...mapStores(authStore, snackbarStore)
  },
  methods: {
    async createAdminAccount(): Promise<void> {
      this.loading = true;

      try {
        this.auth.setAxiosHeader();

        await this.$api.startup.updateStartupUser({
          startupUserDto: this.admin
        });

        this.$emit('step-complete', { step: 2 });
      } catch (error) {
        console.error(error);
        this.snackbar.push(this.$t('wizard.setAdminError'), 'error');
      }

      this.loading = false;
    }
  }
});
</script>
