<template>
  <div>
    <v-form
      ref="form"
      v-model="validInputs"
      :disabled="loading"
      @submit.prevent="connectToServer"
    >
      <v-text-field
        v-model="serverUrl"
        outlined
        :label="$t('serverAddress')"
        type="url"
        :rules="rules.serverUrlTest"
        required
      ></v-text-field>
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

export default Vue.extend({
  data() {
    return {
      serverUrl: '',
      validInputs: false,
      loading: false,
      rules: {
        serverUrlTest: [
          (v: string) => !!v || this.$t('serverAddressRequired'),
          (v: string) =>
            /^https?:\/\/.+/.test(v) || this.$t('serverAddressMustBeUrl')
        ]
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
