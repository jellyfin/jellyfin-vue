<template>
  <v-dialog
    :value="addingNewKey"
    :width="width"
    @click:outside="() => (addingNewKey = false)"
  >
    <v-col class="pa-0 add-key-dialog">
      <v-card>
        <v-card-title>{{ $t('settings.apiKeys.addApiKey') }}</v-card-title>
        <v-card-actions>
          <v-form class="add-key-form" @submit.prevent="addApiKey">
            <v-text-field
              v-model="newKeyAppName"
              outlined
              :label="$t('settings.apiKeys.appName')"
            />
            <v-btn color="primary" :loading="loading" @click="addApiKey">
              {{ $t('confirm') }}
            </v-btn>
            <v-btn @click="() => (addingNewKey = false)">
              {{ $t('cancel') }}
            </v-btn>
          </v-form>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';

export default Vue.extend({
  data() {
    return {
      addingNewKey: false,
      newKeyAppName: '',
      loading: false
    };
  },
  computed: {
    width(): number | string {
      switch (this.$vuetify.breakpoint.name) {
        case 'xs':
          return '100%';
        case 'sm':
          return 400;
        case 'md':
          return 500;
        case 'lg':
        case 'xl':
        default:
          return 600;
      }
    }
  },
  methods: {
    ...mapActions('snackbar', ['pushSnackbarMessage']),
    async addApiKey(): Promise<void> {
      this.loading = true;
      try {
        await this.$api.apiKey.createKey({
          app: this.newKeyAppName
        });

        this.pushSnackbarMessage({
          message: this.$t('settings.apiKeys.createKeySuccess'),
          color: 'success'
        });

        this.newKeyAppName = '';
        this.$emit('key-added');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error);

        this.pushSnackbarMessage({
          message: this.$t('settings.apiKeys.createKeyFailure'),
          color: 'error'
        });
      }
      this.loading = false;
      this.addingNewKey = false;
    },
    openDialog(): void {
      this.addingNewKey = true;
    }
  }
});
</script>

<style lang="scss" scoped>
.add-key-form {
  width: 100%;
}
</style>
