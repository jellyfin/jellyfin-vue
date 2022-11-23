<template>
  <div>
    <validation-observer v-slot="{ invalid }">
      <v-form :disabled="loading" @submit.prevent="connectToServer">
        <validation-provider
          v-slot="{ errors }"
          name="serverUrl"
          :rules="rules.serverUrl">
          <v-text-field
            v-model="serverUrl"
            variant="outlined"
            autofocus
            :label="$t('login.serverAddress')"
            type="url"
            :error-messages="errors"
            required />
        </validation-provider>
        <v-row align="center" no-gutters>
          <v-col v-if="previousServerLength" class="mr-2">
            <v-btn block size="large" @click="$router.push('/server/select')">
              {{ $t('login.changeServer') }}
            </v-btn>
          </v-col>
          <v-col class="mr-2">
            <v-btn
              :disabled="invalid"
              :loading="loading"
              block
              size="large"
              color="primary"
              type="submit">
              {{ $t('login.connect') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-form>
    </validation-observer>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  data() {
    return {
      serverUrl: '',
      loading: false,
      rules: {
        serverUrl: {
          required: true,
          mustBeUrl: true
        }
      },
      previousServerLength: 0
    };
  },
  mounted() {
    /**
     * Instead of mapping the current state from the store, we use the number of servers that are present
     * during the initialization of the component. That way, we can do the redirection to the correct page
     * properly and stop the "Change server" button from appearing right after adding the first server
     * and while the transition is playing.
     */
    this.previousServerLength = this.$remote.auth.servers.value.length;
  },
  methods: {
    async connectToServer(): Promise<void> {
      this.loading = true;

      try {
        await this.$remote.auth.connectServer(this.serverUrl);

        if (this.previousServerLength === 0) {
          this.$router.push('/server/login');
        } else {
          this.$router.push('/server/select');
        }
      } finally {
        this.loading = false;
      }
    }
  }
});
</script>
