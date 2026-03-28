<template>
  <VContainer
    class="uno-flex uno-flex-wrap uno-items-center !uno-h-full"
    fluid>
    <VRow justify="center">
      <VCol
        v-if="!currentUser && !loginAsOther && publicUsers.length"
        sm="10"
        md="7"
        lg="5">
        <h1 class="text-h4 uno-mb-6 uno-text-center">
          {{ $t('selectUser') }}
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
          class="uno-mt-6">
          <VCol
            cols="11"
            sm="6"
            class="uno-flex uno-justify-center">
            <VBtn
              block
              size="large"
              variant="elevated"
              @click="loginAsOther = true">
              {{ $t('manualLogin') }}
            </VBtn>
          </VCol>
          <VCol
            cols="11"
            sm="6"
            class="uno-flex uno-justify-center">
            <VBtn
              v-if="jsonConfig.allowServerSelection"
              block
              to="/server/select"
              size="large"
              variant="elevated">
              {{ $t('changeServer') }}
            </VBtn>
          </VCol>
        </VRow>
      </VCol>
      <VCol
        v-else-if="
          currentUser ||
            loginAsOther ||
            (publicUsers.length === 0 && $remote.auth.currentServer.value?.ServerName)
        "
        sm="6"
        md="6"
        lg="5">
        <h1
          v-if="currentUser"
          class="text-h4 uno-mb-3 uno-text-center">
          {{ $t('loginAs', { name: currentUser.Name }) }}
        </h1>
        <h1
          v-else
          class="text-h4 uno-text-center">
          {{ $t('login') }}
        </h1>
        <h5 class="text--disabled uno-mb-3 uno-text-center">
          {{ $remote.auth.currentServer.value?.ServerName }}
        </h5>
        <LoginForm
          :user="currentUser"
          :disabled="!isConnectedToServer"
          @change="resetCurrentUser" />
        <p
          v-if="disclaimer"
          class="text-p uno-mt-6 uno-text-center">
          <JSafeHtml :html="disclaimer" />
        </p>
      </VCol>
    </VRow>
  </VContainer>
</template>

<route lang="yaml">
meta:
  layout:
    name: server
</route>

<script setup lang="ts">
import type { UserDto } from '@jellyfin/sdk/lib/generated-client';
import { ref, shallowRef, computed, watch } from 'vue';
import { useTranslation } from 'i18next-vue';
import { remote } from '#/plugins/remote';
import { jsonConfig } from '#/utils/external-config';
import { usePageTitle } from '#/composables/page-title';
import { useSnackbar } from '#/composables/use-snackbar';
import { isConnectedToServer } from '#/store';

const { t } = useTranslation();

usePageTitle(() => t('login'));

const disclaimer = computed(() => remote.auth.currentServer.value?.BrandingOptions.LoginDisclaimer);
const publicUsers = computed(() => remote.auth.currentServer.value?.PublicUsers ?? []);

const loginAsOther = shallowRef(false);
const currentUser = ref<UserDto>();

/**
 * Sets the current user for public user login
 */
async function setCurrentUser(user: UserDto): Promise<void> {
  if (!user.HasPassword && user.Name) {
    // If the user doesn't have a password, avoid showing the password form
    await remote.auth.loginUser(user.Name, '');
  } else {
    currentUser.value = user;
  }
}

/**
 * Resets the currently selected user
 */
function resetCurrentUser(): void {
  currentUser.value = undefined;
  loginAsOther.value = false;
}

watch(isConnectedToServer, () => {
  if (!isConnectedToServer.value) {
    useSnackbar(t('noServerConnection'), 'error');
  }
});
</script>
