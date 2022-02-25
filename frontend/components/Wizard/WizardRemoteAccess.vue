<template>
  <div>
    <v-checkbox
      v-model="allowRemoteAccess"
      :label="$t('wizard.allowRemoteAccess')"
    />
    <v-checkbox v-model="enableUPNP" :label="$t('enableUPNP')" />
    <v-btn color="secondary" @click="$emit('previous-step')">
      {{ $t('previous') }}
    </v-btn>
    <v-btn :loading="loading" color="primary" @click="setRemoteAccess">
      {{ $t('finish') }}
    </v-btn>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapStores } from 'pinia';
import { snackbarStore } from '~/store';

export default Vue.extend({
  data() {
    return {
      allowRemoteAccess: false,
      enableUPNP: false,
      loading: false
    };
  },
  methods: {
    async setRemoteAccess(): Promise<void> {
      this.loading = true;

      try {
        await this.$api.startup.setRemoteAccess({
          startupRemoteAccessDto: {
            EnableRemoteAccess: this.allowRemoteAccess,
            EnableAutomaticPortMapping: this.enableUPNP
          }
        });

        this.$emit('step-complete', { step: 4 });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        this.snackbar.push(this.$t('wizard.setRemoteError'), 'error');
      }

      this.loading = false;
    }
  },
  computed: {
    ...mapStores(snackbarStore)
  }
});
</script>
