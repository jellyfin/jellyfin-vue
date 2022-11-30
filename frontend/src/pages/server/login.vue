<template>
  <v-container fill-height>
    <v-row align="center" justify="center">
      <v-col
        v-if="isEmpty(currentUser) && !loginAsOther && publicUsers.length > 0"
        sm="10"
        md="7"
        lg="5">
        <h1 class="text-h4 mb-6 text-center">{{ $t('login.selectUser') }}</h1>
        <v-row align="center" justify="center">
          <v-col
            v-for="publicUser in publicUsers"
            :key="publicUser.Id"
            cols="auto">
            <user-card :user="publicUser" @connect="setCurrentUser" />
          </v-col>
        </v-row>
        <v-row align="center" justify="center" dense class="mt-6">
          <v-col cols="11" sm="6" class="d-flex justify-center">
            <v-btn block size="large" @click="loginAsOther = true">
              {{ $t('login.manualLogin') }}
            </v-btn>
          </v-col>
          <v-col cols="11" sm="6" class="d-flex justify-center">
            <v-btn block to="/server/select" size="large">
              {{ $t('login.changeServer') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
      <v-col
        v-else-if="
          !isEmpty(currentUser) ||
          loginAsOther ||
          (publicUsers.length === 0 &&
            $remote.auth.currentServer.value?.ServerName)
        "
        sm="6"
        md="6"
        lg="5">
        <h1 v-if="!isEmpty(currentUser)" class="text-h4 mb-3 text-center">
          {{ $t('login.loginAs', { name: currentUser.Name }) }}
        </h1>
        <h1 v-else class="text-h4 text-center">
          {{ $t('login.login') }}
        </h1>
        <h5 class="text-center mb-3 text--disabled">
          {{ $remote.auth.currentServer.value?.ServerName }}
        </h5>
        <login-form :user="currentUser" @change="resetCurrentUser" />
        <p class="text-p mt-6 text-center">{{ disclaimer }}</p>
      </v-col>
    </v-row>
  </v-container>
</template>

<route lang="yaml">
meta:
  layout: fullpage
</route>

<script lang="ts">
import { defineComponent } from 'vue';
import { isEmpty } from 'lodash-es';
import { UserDto } from '@jellyfin/sdk/lib/generated-client';
import { getBrandingApi } from '@jellyfin/sdk/lib/utils/api/branding-api';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useRemote } from '@/composables';

export default defineComponent({
  async setup() {
    const { t } = useI18n();
    const route = useRoute();
    const remote = useRemote();
    const api = remote.sdk.oneTimeSetup(
      remote.auth.currentServer.value?.PublicAddress || ''
    );

    route.meta.title = t('login.login');

    const brandingData = (await getBrandingApi(api).getBrandingOptions()).data;
    const publicUsers = (await getUserApi(api).getPublicUsers({})).data;

    const disclaimer = brandingData.LoginDisclaimer;

    return { publicUsers, disclaimer };
  },
  data() {
    return {
      loginAsOther: false,
      currentUser: {} as UserDto
    };
  },
  methods: {
    isEmpty(value: Record<never, never>): boolean {
      return isEmpty(value);
    },
    async setCurrentUser(user: UserDto): Promise<void> {
      if (!user.HasPassword && user.Name) {
        // If the user doesn't have a password, avoid showing the password form
        await this.$remote.auth.loginUser(user.Name, '', true);
      } else {
        this.currentUser = user;
      }
    },
    resetCurrentUser(): void {
      this.currentUser = {};
      this.loginAsOther = false;
    }
  }
});
</script>
