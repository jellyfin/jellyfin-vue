<template>
  <div>
    <v-form
      ref="form"
      v-model="validInputs"
      :disabled="loading"
      @submit.prevent="connectToServer"
    >
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
            :disabled="!validInputs"
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
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';
import { ValidationProvider } from 'vee-validate';

export default Vue.extend({
  components: {
    ValidationProvider
  },
  data() {
    return {
      serverUrl: '',
      validInputs: false,
      loading: false,
      rules: {
        serverUrl: {
          required: true,
          mustBeUrl: true
        }
      }
      // rules: {
      //   serverUrlTest: [
      //     (v: string) => !!v || this.$t('serverAddressRequired'),
      //     (v: string) =>
      //       /^https?:\/\/.+/.test(v) || this.$t('serverAddressMustBeUrl')
      //   ]
      // }
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
