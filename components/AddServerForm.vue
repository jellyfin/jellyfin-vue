<template>
  <div>
    <validation-observer v-slot="{ invalid }">
      <v-form ref="form" :disabled="loading" @submit.prevent="connectToServer">
        <validation-provider
          v-slot="{ errors }"
          name="serverUrl"
          :rules="rules.serverUrl"
        >
          <v-text-field
            v-model="serverUrl"
            outlined
            :label="$t('serverAddress')"
            type="url"
            :error-messages="errors"
            required
          ></v-text-field>
        </validation-provider>
        <v-row align="center" no-gutters>
          <v-col class="mr-2">
            <v-btn
              :disabled="invalid"
              :loading="loading"
              block
              large
              color="primary"
              type="submit"
              >{{ $t('connect') }}</v-btn
            >
          </v-col>
          <v-col cols="auto">
            <locale-switcher />
          </v-col>
        </v-row>
      </v-form>
    </validation-observer>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';
import { ValidationObserver, ValidationProvider } from 'vee-validate';

export default Vue.extend({
  components: {
    ValidationObserver,
    ValidationProvider
  },
  data() {
    return {
      serverUrl: '',
      loading: false,
      rules: {
        serverUrl: {
          required: true,
          mustBeUrl: true
        }
      }
    };
  },
  methods: {
    ...mapActions('servers', ['connectServer']),
    connectToServer() {
      this.loading = true;
      this.connectServer(this.serverUrl);
      this.loading = false;
    }
  }
});
</script>
