<template>
  <SettingsPage page-title="newUser">
    <template #actions>
      <VBtn
        variant="elevated"
        href="https://jellyfin.org/docs/general/server/users/"
        rel="noreferrer noopener"
        target="_blank">
        {{ t('help') }}
      </VBtn>
    </template>
    <template #content>
      <VCard
        width="100%"
        height="100%">
        <VForm
          class="py-5 px-2"
          @submit.prevent="createUser">
          <VRow>
            <VCol>
              <VTextField
                v-model="name"
                :label="t('name')" />
            </VCol>
          </VRow>
          <VRow>
            <VCol>
              <VTextField
                v-model="password"
                :label="t('password')" />
            </VCol>
          </VRow>
          <VRow>
            <VCol>
              <div class="text-subtitle-1 font-weight-medium text-capitalize">
                {{ t('libraryAccess') }}
              </div>
              <VCheckbox
                v-model="canAccessAllLibraries"
                :label="t('allLibraries')" />
              <VCard
                v-if="!canAccessAllLibraries"
                :title="t('libraries')"
                variant="tonal">
                <VRow
                  v-for="library in libraries?.Items"
                  :key="library.Id">
                  <VCol>
                    <VCheckbox
                      v-model="accessableLibraries"
                      :label="library.Name!"
                      :value="library.Id" />
                  </VCol>
                </VRow>
                <div class="text-warning ml-2">
                  {{ t('libraryAccessNote') }}
                </div>
              </VCard>
            </VCol>
          </VRow>
          <VRow>
            <VCol>
              <VBtn
                color="primary"
                variant="elevated"
                :loading="loading"
                class="float-right"
                @click="createUser">
                {{ t('newUser') }}
              </VBtn>
            </VCol>
          </VRow>
        </VForm>
      </VCard>
    </template>
  </SettingsPage>
</template>

<route lang="yaml">
meta:
  admin: true
</route>

<script setup lang="ts">
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { remote } from '@/plugins/remote';

const { t } = useI18n();
const router = useRouter();
const name = ref('');
const password = ref('');
const canAccessAllLibraries = ref(true);
const accessableLibraries = ref<string[]>([]);
const loading = ref(false);

const libraries = (
  await remote.sdk.newUserApi(getLibraryApi).getMediaFolders({ isHidden: false })
).data;

/**
 * Creates a new user
 */
async function createUser(): Promise<void> {
  try {
    loading.value = true;

    // Create the user
    const res = (await remote.sdk.newUserApi(getUserApi).createUserByName({
      createUserByName: {
        Name: name.value
      }
    })).data;

    // Set the library access policy
    await remote.sdk.newUserApi(getUserApi).updateUserPolicy({
      userId: res.Id ?? '',
      userPolicy: {
        ...res.Policy!,
        EnableAllFolders: canAccessAllLibraries.value,
        ...(!canAccessAllLibraries.value && {
          EnabledFolders: accessableLibraries.value
        })
      }
    });

    await router.push(`/settings/users/${res.Id}`);
  } catch {} finally {
    loading.value = false;
  }
}

</script>
