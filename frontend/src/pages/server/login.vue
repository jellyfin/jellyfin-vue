<template>
  <v-container class="fill-height" fluid>
    <v-row justify="center">
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
            <v-btn
              block
              size="large"
              variant="elevated"
              @click="loginAsOther = true">
              {{ $t('login.manualLogin') }}
            </v-btn>
          </v-col>
          <v-col cols="11" sm="6" class="d-flex justify-center">
            <v-btn block to="/server/select" size="large" variant="elevated">
              {{ $t('login.changeServer') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-col>
      <v-col
        v-else-if="
          !isEmpty(currentUser) ||
          loginAsOther ||
          (publicUsers.length === 0 && $remote.auth.currentServer?.ServerName)
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
          {{ $remote.auth.currentServer?.ServerName }}
        </h5>
        <login-form :user="currentUser" @change="resetCurrentUser" />
        <p class="text-p mt-6 text-center">{{ disclaimer }}</p>
      </v-col>
    </v-row>
  </v-container>
</template>

<route lang="yaml">
meta:
  layout: server
</route>

<script setup lang="ts">
import { ref } from 'vue';
import { isEmpty } from 'lodash-es';
import { UserDto } from '@jellyfin/sdk/lib/generated-client';
import { getBrandingApi } from '@jellyfin/sdk/lib/utils/api/branding-api';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useRemote } from '@/composables';

const { t } = useI18n();
const route = useRoute();
const remote = useRemote();
const api = remote.sdk.oneTimeSetup(
  remote.auth.currentServer?.PublicAddress || ''
);

route.meta.title = t('login.login');

const brandingData = (await getBrandingApi(api).getBrandingOptions()).data;
const publicUsers = (await getUserApi(api).getPublicUsers({})).data;

const disclaimer = brandingData.LoginDisclaimer;

const loginAsOther = ref(false);
const currentUser = ref<UserDto>({});

/**
 * Sets the current user for public user login
 */
async function setCurrentUser(user: UserDto): Promise<void> {
  if (!user.HasPassword && user.Name) {
    // If the user doesn't have a password, avoid showing the password form
    await remote.auth.loginUser(user.Name, '', true);
  } else {
    currentUser.value = user;
  }
}

/**
 * Resets the currently selected user
 */
function resetCurrentUser(): void {
  currentUser.value = {};
  loginAsOther.value = false;
}
</script>
