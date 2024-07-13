<template>
  <VContainer
    class="fill-height"
    fluid>
    <VRow justify="center">
      <VCol
        v-if="!currentUser && !loginAsOther && publicUsers.length"
        sm="10"
        md="7"
        lg="5">
        <h1 class="text-h4 mb-6 text-center">
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
              {{ $t('manualLogin') }}
            </VBtn>
          </VCol>
          <VCol
            cols="11"
            sm="6"
            class="d-flex justify-center">
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
            (publicUsers.length === 0 && $remote.auth.currentServer?.ServerName)
        "
        sm="6"
        md="6"
        lg="5">
        <h1
          v-if="currentUser"
          class="text-h4 mb-3 text-center">
          {{ $t('loginAs', { name: currentUser.Name }) }}
        </h1>
        <h1
          v-else
          class="text-h4 text-center">
          {{ $t('login') }}
        </h1>
        <h5 class="text-center mb-3 text--disabled">
          {{ $remote.auth.currentServer?.ServerName }}
        </h5>
        <LoginForm
          :user="currentUser"
          @change="resetCurrentUser" />
        <p
          v-if="disclaimer"
          class="mt-6 text-center text-p">
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
import { ref, shallowRef, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { watchImmediate } from '@vueuse/core';
import { remote } from '@/plugins/remote';
import { getJSONConfig } from '@/utils/external-config';
import { isConnectedToServer } from '@/store';
import { usePageTitle } from '@/composables/page-title';

const jsonConfig = await getJSONConfig();
const { t } = useI18n();
const router = useRouter();

usePageTitle(() => t('login'));

watchImmediate(isConnectedToServer, async () => {
  if (!isConnectedToServer.value) {
    await router.replace('/server/select');
  }
});

const disclaimer = computed(() => remote.auth.currentServer?.BrandingOptions.LoginDisclaimer);
const publicUsers = computed(() => remote.auth.currentServer?.PublicUsers ?? []);

const loginAsOther = shallowRef(false);
const currentUser = ref<UserDto>();

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
  currentUser.value = undefined;
  loginAsOther.value = false;
}
</script>
