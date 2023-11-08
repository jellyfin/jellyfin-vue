<template>
  <VContainer
    class="fill-height"
    fluid>
    <VRow justify="center">
      <VCol
        v-if="isEmpty(currentUser) && !loginAsOther && publicUsers.length > 0"
        sm="10"
        md="7"
        lg="5">
        <h1 class="text-h4 mb-6 text-center">
          {{ $t('login.selectUser') }}
        </h1>
        <VRow
          align="center"
          justify="center">
          <VCol
            v-for="publicUser in publicUsers"
            :key="publicUser.Id"
            cols="auto">
            <UserCard
              :user="publicUser"
              @connect="setCurrentUser" />
          </VCol>
        </VRow>
        <VRow
          align="center"
          justify="center"
          dense
          class="mt-6">
          <VCol
            cols="11"
            sm="6"
            class="d-flex justify-center">
            <VBtn
              block
              size="large"
              variant="elevated"
              @click="loginAsOther = true">
              {{ $t('login.manualLogin') }}
            </VBtn>
          </VCol>
          <VCol
            cols="11"
            sm="6"
            class="d-flex justify-center">
            <VBtn
              block
              to="/server/select"
              size="large"
              variant="elevated">
              {{ $t('login.changeServer') }}
            </VBtn>
          </VCol>
        </VRow>
      </VCol>
      <VCol
        v-else-if="
          !isEmpty(currentUser) ||
            loginAsOther ||
            (publicUsers.length === 0 && $remote.auth.currentServer?.ServerName)
        "
        sm="6"
        md="6"
        lg="5">
        <h1
          v-if="!isEmpty(currentUser)"
          class="text-h4 mb-3 text-center">
          {{ $t('login.loginAs', { name: currentUser.Name }) }}
        </h1>
        <h1
          v-else
          class="text-h4 text-center">
          {{ $t('login.login') }}
        </h1>
        <h5 class="text-center mb-3 text--disabled">
          {{ $remote.auth.currentServer?.ServerName }}
        </h5>
        <LoginForm
          :user="currentUser"
          @change="resetCurrentUser" />
        <p class="text-p mt-6 text-center">
          {{ disclaimer }}
        </p>
      </VCol>
    </VRow>
  </VContainer>
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
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import { useRoute, useRouter } from 'vue-router/auto';
import { useI18n } from 'vue-i18n';
import { useRemote } from '@/composables';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const remote = useRemote();
const api = remote.sdk.oneTimeSetup(
  remote.auth.currentServer?.PublicAddress ?? ''
);

route.meta.title = t('login.login');

try {
  await getSystemApi(api).getPublicSystemInfo();
} catch {
  await router.replace('/server/select');
}

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
    await remote.auth.loginUser(user.Name, '');
    await router.replace('/');
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
