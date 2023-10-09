<template>
  <SettingsPage page-title="settings.users.users">
    <template #actions>
      <VBtn
        variant="elevated"
        href="https://jellyfin.org/docs/general/server/users/"
        rel="noreferrer noopener"
        target="_blank">
        {{ t('settings.help') }}
      </VBtn>
    </template>
    <template #content>
      <VCard
        width="100%"
        height="100%">
        <VTabs
          v-model="tab"
          color="deep-purple-accent-4"
          align-tabs="center">
          <VTab :value="1">
            {{ t("settings.users.tabs.profile.profile") }}
          </VTab>
          <VTab :value="2">
            {{ t("settings.users.tabs.access.access") }}
          </VTab>
          <VTab :value="3">
            {{ t("settings.users.tabs.parentalControl.parentalControl") }}
          </VTab>
          <VTab :value="4">
            {{ t("settings.users.tabs.password.password") }}
          </VTab>
        </VTabs>
        <VWindow v-model="tab">
          <VWindowItem
            :key="1"
            :value="1">
            <VForm>
              <VContainer>
                <VRow>
                  <VCol>
                    <VTextField
                      v-model="initializedUser.Name"
                      :label="t('settings.users.tabs.profile.name')"
                      hide-details />
                  </VCol>
                </VRow>
                <VRow>
                  <VCol>
                    <VBtn
                      :loading="loading"
                      color="error"
                      variant="elevated"
                      @click="deleteUser">
                      {{ t('settings.users.tabs.profile.deleteUser') }}
                    </VBtn>
                  </VCol>
                  <VCol>
                    <VBtn
                      :loading="loading"
                      color="primary"
                      variant="elevated"
                      class="float-right"
                      @click="saveProfile">
                      {{ t('save') }}
                    </VBtn>
                  </VCol>
                </VRow>
              </VContainer>
            </VForm>
          </VWindowItem>
          <VWindowItem
            :key="2"
            :value="2">
            <VForm>
              <VContainer>
                <VRow>
                  <VCol>
                    <VCheckbox
                      v-model="initializedUser.CanAccessAllLibraries"
                      :label="t('settings.users.tabs.access.allLibraries')" />
                    <VCol />
                  </vcol>
                </VRow>
                <div v-if="!initializedUser.CanAccessAllLibraries && libraries">
                  <VRow>
                    <div
                      class="text-subtitle-1 text--secondary font-weight-medium text-capitalize">
                      {{ $t('settingsSections.libraries.name') }}
                    </div>
                  </VRow>
                  <VRow
                    v-for="library of libraries.Items"
                    :key="library.Id">
                    <VCol>
                      <VCheckbox
                        v-model="initializedUser.Folders"
                        :value="library.Id"
                        :label="library.Name!" />
                    </VCol>
                  </VRow>
                </div>
                <VRow>
                  <VCol>
                    <VBtn
                      :loading="loading"
                      color="primary"
                      variant="elevated"
                      class="float-right"
                      @click="saveAccess">
                      {{ t('save') }}
                    </VBtn>
                  </VCol>
                </VRow>
              </VContainer>
            </VForm>
          </VWindowItem>
          <VWindowItem
            :key="3"
            :value="3">
            <VForm>
              <VContainer>
                <VRow>
                  <VCol>
                    <VSelect
                      v-model="initializedUser.maxParentalRating"
                      :label="t('settings.users.tabs.parentalControl.maxAllowedRating')"
                      :items="parentalCategories"
                      item-title="label"
                      item-value="id"
                      hide-details
                      clearable />
                    <div
                      class="text-subtitle-1 text-warning font-weight-medium">
                      {{ $t('settings.users.tabs.parentalControl.maxAllowedRatingSubtitle') }}
                    </div>
                  </VCol>
                </VRow>
                <VRow>
                  <VCol>
                    <div
                      class="text-subtitle-1 text--secondary font-weight-medium text-capitalize">
                      {{ $t('settings.users.tabs.parentalControl.blockUnratedItems') }}
                    </div>
                  </VCol>
                </VRow>
                <VContainer>
                  <VRow dense>
                    <VCol>
                      <VCheckbox
                        v-model="initializedUser.BlockUnratedItems"
                        :label="t('books')"
                        value="Book"
                        density="compact" />
                    </VCol>
                  </VRow>
                  <VRow dense>
                    <VCol>
                      <VCheckbox
                        v-model="initializedUser.BlockUnratedItems"
                        :label="t('channels')"
                        value="ChannelContent"
                        density="compact" />
                    </VCol>
                  </VRow>
                  <VRow dense>
                    <VCol>
                      <VCheckbox
                        v-model="initializedUser.BlockUnratedItems"
                        :label="t('liveTv')"
                        value="LiveTvChannel"
                        density="compact" />
                    </VCol>
                  </VRow>
                  <VRow dense>
                    <VCol>
                      <VCheckbox
                        v-model="initializedUser.BlockUnratedItems"
                        :label="t('movies')"
                        value="Movie"
                        density="compact" />
                    </VCol>
                  </VRow>
                  <VRow dense>
                    <VCol>
                      <VCheckbox
                        v-model="initializedUser.BlockUnratedItems"
                        :label="t('music')"
                        value="Music"
                        density="compact" />
                    </VCol>
                  </VRow>
                  <VRow dense>
                    <VCol>
                      <VCheckbox
                        v-model="initializedUser.BlockUnratedItems"
                        :label="t('trailer')"
                        value="Trailer"
                        density="compact" />
                    </VCol>
                  </VRow>
                  <VRow dense>
                    <VCol>
                      <VCheckbox
                        v-model="initializedUser.BlockUnratedItems"
                        :label="t('shows')"
                        value="Series"
                        density="compact" />
                    </VCol>
                  </VRow>
                </VContainer>
                <VContainer>
                  <VRow>
                    <VCol>
                      <div
                        class="text-title font-weight-medium text-capitalize">
                        {{ t('settings.users.tabs.parentalControl.blockTags') }}
                      </div>
                    </VCol>
                    <VCol>
                      <VBtn
                        color="secondary"
                        variant="elevated"
                        @click="addTagDialogOpen = true">
                        {{ t('settings.users.tabs.parentalControl.addBlockedTag') }}
                      </VBtn>
                    </VCol>
                  </VRow>
                  <VRow
                    v-for="blockedTag of initializedUser.BlockedTags"
                    :key="blockedTag">
                    <VCol>
                      <div
                        class="text-subtitle-1 font-weight-medium text-capitalize">
                        {{ blockedTag }}
                      </div>
                    </VCol>
                    <VCol>
                      <VBtn
                        :disabled="loading"
                        color="error"
                        @click="() => initializedUser.BlockedTags = initializedUser.BlockedTags.filter(tag => tag !== blockedTag)">
                        {{ t('settings.users.tabs.parentalControl.unblockTag') }}
                      </VBtn>
                    </VCol>
                  </VRow>
                </VContainer>
                <VRow>
                  <VCol>
                    <VBtn
                      :loading="loading"
                      color="primary"
                      variant="elevated"
                      class="float-right"
                      @click="saveParentalControl">
                      {{ t('save') }}
                    </VBtn>
                  </VCol>
                </VRow>
              </VContainer>
            </VForm>
          </VWindowItem>
          <VWindowItem
            :key="4"
            :value="4">
            <VForm>
              <VContainer>
                <VRow>
                  <VCol>
                    <VTextField
                      v-if="user.HasPassword"
                      v-model="initializedUser.CurrentPassword"
                      :disabled="loading"
                      :label="t('settings.users.tabs.password.currentPassword')"
                      hide-details />
                  </VCol>
                </VRow>
                <VRow>
                  <VCol>
                    <VTextField
                      v-model="initializedUser.Password"
                      :disabled="loading"
                      :label="t('settings.users.tabs.password.newPassword')"
                      hide-details />
                  </VCol>
                </VRow>
                <VRow>
                  <VCol>
                    <VTextField
                      v-model="initializedUser.ConfirmPassword"
                      :disabled="loading"
                      :label="t('settings.users.tabs.password.confirmPassword')"
                      hide-details />
                  </VCol>
                </VRow>
                <VRow>
                  <VCol>
                    <VBtn
                      v-if="user.HasPassword"
                      :disabled="loading"
                      :loading="loading"
                      variant="elevated"
                      color="error"
                      @click="resetPassword">
                      {{ t('settings.users.tabs.password.resetPassword') }}
                    </VBtn>
                  </VCol>
                  <VCol>
                    <VBtn
                      :disabled="loading"
                      variant="elevated"
                      color="primary"
                      class="float-right"
                      @click="submitPassword">
                      {{ t('save') }}
                    </VBtn>
                  </VCol>
                </VRow>
              </VContainer>
            </VForm>
          </VWindowItem>
        </VWindow>
      </VCard>
      <VDialog
        v-model="addTagDialogOpen"
        width="auto">
        <VCol class="pa-0 add-key-dialog">
          <VCard>
            <VCardTitle>{{ t('settings.users.tabs.parentalControl.addBlockedTag') }}</VCardTitle>
            <VCardActions>
              <VForm
                class="add-key-form"
                @submit.prevent="initializedUser.BlockedTags.push(newTagValue); addTagDialogOpen = false; newTagValue = '';">
                <VTextField
                  v-model="newTagValue"
                  variant="outlined"
                  :label="t('settings.users.tabs.parentalControl.tagName')" />
                <VBtn
                  color="primary"
                  :loading="loading"
                  :disabled="newTagValue === ''"
                  @click="initializedUser.BlockedTags.push(newTagValue); addTagDialogOpen = false; newTagValue = '';">
                  {{ $t('confirm') }}
                </VBtn>
                <VBtn @click="() => {addTagDialogOpen = false}">
                  {{ $t('cancel') }}
                </VBtn>
              </VForm>
            </VCardActions>
          </VCard>
        </VCol>
      </VDialog>
    </template>
  </SettingsPage>
</template>

<route lang="yaml">
meta:
  admin: true
</route>

<script setup lang="ts">
import {
  BaseItemDtoQueryResult,
  UnratedItem,
  UserDto
} from '@jellyfin/sdk/lib/generated-client';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute , useRouter } from 'vue-router';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { getLocalizationApi } from '@jellyfin/sdk/lib/utils/api/localization-api';
import { useConfirmDialog, useRemote } from '@/composables';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const remote = useRemote();

const loading = ref<boolean>(false);
const addTagDialogOpen = ref<boolean>(false);
const newTagValue = ref<string>('');
const user = ref<UserDto>({});
const libraries = ref<BaseItemDtoQueryResult>();
const parentalCategories = ref<{ label: string, id: number | undefined }[]>([]);
const initializedUser = ref<{ Name: string, CurrentPassword: string, Password: string, ConfirmPassword: string, CanAccessAllLibraries: boolean, Folders: string[], maxParentalRating: number | undefined, BlockUnratedItems: UnratedItem[], BlockedTags: string[] }>({Name: '', CurrentPassword: '', Password: '', ConfirmPassword: '', CanAccessAllLibraries: false, Folders: [], maxParentalRating: undefined, BlockUnratedItems: [], BlockedTags: []});
const tab = ref<number>(1);

onMounted(async () => {
  const { userId } = route.params as { userId: string };

  user.value = (await remote.sdk.newUserApi(getUserApi).getUserById({
    userId: userId
  })).data;
  initializeUser();
  libraries.value = (await remote.sdk.newUserApi(getLibraryApi).getMediaFolders({isHidden: false})).data;

  const cats = (await remote.sdk.newUserApi(getLocalizationApi).getParentalRatings()).data;

  for (const cat of cats) {
    if (parentalCategories.value.some((c) => c.id === cat.Value!)) {
      parentalCategories.value = parentalCategories.value.map((c) => {
        if (c.id === cat.Value!) {
          return {label: `${c.label}/${cat.Name!}`, id: cat.Value};
        }

        return c;
      });
    } else {
      parentalCategories.value.push({label: cat.Name!, id: cat.Value!});
    }
  }
});

/**
 * Saves the changed user access
 */
async function saveAccess(): Promise<void> {
  if (!user.value.Id) {
    return;
  }

  loading.value = true;
  console.log(initializedUser.value.Folders);
  await remote.sdk.newUserApi(getUserApi).updateUserPolicy({
    userId: user.value.Id,
    userPolicy: {...user.value.Policy, EnableAllFolders: initializedUser.value.CanAccessAllLibraries, EnabledFolders: initializedUser.value.Folders}
  });
  await refreshData();
  loading.value = false;
}

/**
 * Saves the changed profile
 */
async function saveProfile(): Promise<void> {
  if (!user.value.Id) {
    return;
  }

  loading.value = true;
  await remote.sdk.newUserApi(getUserApi).updateUser({
    userId: user.value.Id,
    userDto: {...user.value, Name: initializedUser.value.Name}
  });
  await refreshData();
  loading.value = false;
}

/**
 * Saves the changed parental control
 */
async function saveParentalControl(): Promise<void> {
  if (!user.value.Id) {
    return;
  }

  loading.value = true;
  await remote.sdk.newUserApi(getUserApi).updateUserPolicy({
    userId: user.value.Id,
    userPolicy: {
      ...user.value.Policy,
      MaxParentalRating: initializedUser.value.maxParentalRating,
      BlockUnratedItems: initializedUser.value.BlockUnratedItems
    }
  });
  loading.value = false;
}

/**
 * Saves the changed password
 */
async function submitPassword(): Promise<void> {
  if (!user.value.Id) {
    return;
  }

  if (!initializedUser.value.Password || initializedUser.value.Password !== initializedUser.value.ConfirmPassword) {
    return;
  }

  loading.value = true;
  await remote.sdk.newUserApi(getUserApi).updateUserPassword({userId: user.value.Id, updateUserPassword: {NewPw: initializedUser.value.Password, ...(user.value.HasPassword && {CurrentPw: initializedUser.value.ConfirmPassword})}});
  initializedUser.value = {...initializedUser.value, CurrentPassword: '',Password: '', ConfirmPassword: ''};
  await refreshData();
  loading.value = false;
}

/**
 * Refreshes the user data
 */
async function refreshData(): Promise<void> {
  if (!user.value.Id) {
    return;
  }

  user.value = (await remote.sdk.newUserApi(getUserApi).getUserById({
    userId: user.value.Id
  })).data;
  initializeUser();
}

/**
 * Deletes the user
 */
async function deleteUser():Promise<void> {
  await useConfirmDialog(async () => {
    await remote.sdk.newUserApi(getUserApi).deleteUser({userId: user.value.Id!});
    await router.push('/settings/users');
  }, {
    title: t('settings.users.tabs.profile.deleteUser'),
    text: t('settings.users.tabs.profile.deleteUserConfirm'),
    confirmText: t('delete')
  });
}

/**
 * Resets the password
 */
async function resetPassword(): Promise<void> {
  if (!user.value.Id) {
    return;
  }

  loading.value = true;
  await remote.sdk.newUserApi(getUserApi).updateUserPassword({userId: user.value.Id, updateUserPassword: {
    ResetPassword: true
  }});
  await refreshData();
  loading.value = false;
}

/**
 * This function makes sure that all properties are defined
 */
function initializeUser(): void {
  initializedUser.value = {...initializedUser.value, CanAccessAllLibraries:user.value.Policy?.EnableAllFolders ?? false, Name: user.value.Name ?? '', Folders: user.value.Policy?.EnabledFolders ?? [], maxParentalRating: user.value.Policy?.MaxParentalRating ?? undefined, BlockUnratedItems: user.value.Policy?.BlockUnratedItems?? [], BlockedTags: user.value.Policy?.BlockedTags ?? []};
}
</script>
