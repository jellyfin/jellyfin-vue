<template>
  <SettingsPage>
    <template #title>
      {{ t('users') }}
    </template>
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
        <VTabs
          v-model="tab"
          color="deep-purple-accent-4"
          align-tabs="center">
          <VTab :value="1">
            {{ t("profile") }}
          </VTab>
          <VTab :value="2">
            {{ t("access") }}
          </VTab>
          <VTab :value="3">
            {{ t("parentalControl") }}
          </VTab>
          <VTab :value="4">
            {{ t("password") }}
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
                      v-model="model.Name"
                      :label="t('name')"
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
                      {{ t('deleteUser') }}
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
                      v-model="model.CanAccessAllLibraries"
                      :label="t('allLibraries')" />
                    <VCol />
                  </vcol>
                </VRow>
                <div v-if="!model.CanAccessAllLibraries && libraries">
                  <VRow>
                    <div
                      class="text-subtitle-1 text--secondary font-weight-medium text-capitalize">
                      {{ $t('libraries') }}
                    </div>
                  </VRow>
                  <VRow
                    v-for="library of libraries.Items"
                    :key="library.Id">
                    <VCol>
                      <VCheckbox
                        v-model="model.Folders"
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
                      v-model="model.maxParentalRating"
                      :label="t('maxAllowedRating')"
                      :items="parentalCategories"
                      item-title="label"
                      item-value="id"
                      hide-details
                      clearable />
                    <div
                      class="text-subtitle-1 font-weight-medium text-warning">
                      {{ $t('maxAllowedRatingSubtitle') }}
                    </div>
                  </VCol>
                </VRow>
                <VRow>
                  <VCol>
                    <div
                      class="text-subtitle-1 text--secondary font-weight-medium text-capitalize">
                      {{ $t('blockUnratedItems') }}
                    </div>
                  </VCol>
                </VRow>
                <VContainer>
                  <VRow
                    v-for="cat of blockingCategories"
                    :key="cat.value"
                    dense>
                    <VCol>
                      <VCheckbox
                        v-model="model.BlockUnratedItems"
                        :label="cat.label"
                        :value="cat.value"
                        density="compact" />
                    </VCol>
                  </VRow>
                </VContainer>
                <VContainer>
                  <VRow>
                    <VCol>
                      <div
                        class="font-weight-medium text-capitalize text-title">
                        {{ t('blockTags') }}
                      </div>
                    </VCol>
                    <VCol>
                      <VBtn
                        color="secondary"
                        variant="elevated"
                        @click="addTagDialogOpen = true">
                        {{ t('addBlockedTag') }}
                      </VBtn>
                    </VCol>
                  </VRow>
                  <VRow
                    v-for="blockedTag of model.BlockedTags"
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
                        @click="() => model.BlockedTags = model.BlockedTags.filter(tag => tag !== blockedTag)">
                        {{ t('unblockTag') }}
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
                      v-model="model.CurrentPassword"
                      :disabled="loading"
                      :label="t('currentPassword')"
                      hide-details />
                  </VCol>
                </VRow>
                <VRow>
                  <VCol>
                    <VTextField
                      v-model="model.Password"
                      :disabled="loading"
                      :label="t('newPassword')"
                      hide-details />
                  </VCol>
                </VRow>
                <VRow>
                  <VCol>
                    <VTextField
                      v-model="model.ConfirmPassword"
                      :disabled="loading"
                      :label="t('confirmPassword')"
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
                      {{ t('resetPassword') }}
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
            <VCardTitle>{{ t('addBlockedTag') }}</VCardTitle>
            <VCardActions>
              <VForm
                class="add-key-form"
                @submit.prevent="model.BlockedTags.push(newTagValue); addTagDialogOpen = false; newTagValue = '';">
                <VTextField
                  v-model="newTagValue"
                  variant="outlined"
                  :label="t('tagName')" />
                <VBtn
                  color="primary"
                  :loading="loading"
                  :disabled="newTagValue === ''"
                  @click="model.BlockedTags.push(newTagValue); addTagDialogOpen = false; newTagValue = '';">
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
import type {
  BaseItemDtoQueryResult,
  UnratedItem,
  UserDto,
  UserPolicy
} from '@jellyfin/sdk/lib/generated-client';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { getLocalizationApi } from '@jellyfin/sdk/lib/utils/api/localization-api';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { computed, ref } from 'vue';
import { useTranslation } from 'i18next-vue';
import { useRoute, useRouter } from 'vue-router';
import { remote } from '#/plugins/remote';
import { useSnackbar } from '#/composables/use-snackbar';
import { useConfirmDialog } from '#/composables/use-confirm-dialog';

interface CurrentUser {
  Name: string;
  CurrentPassword: string;
  Password: string;
  ConfirmPassword: string;
  CanAccessAllLibraries: boolean;
  Folders: string[];
  maxParentalRating?: number;
  BlockUnratedItems: UnratedItem[];
  BlockedTags: string[];
}

const { t } = useTranslation();
const route = useRoute('/settings/users/[id]');
const router = useRouter();

const loading = ref<boolean>(false);
const addTagDialogOpen = ref<boolean>(false);
const newTagValue = ref<string>('');
const user = ref<UserDto>({});
const libraries = ref<BaseItemDtoQueryResult>();
const parentalCategories = ref<{ label: string; id: number | undefined }[]>([]);
const model = ref<CurrentUser>({
  Name: '',
  CurrentPassword: '',
  Password: '',
  ConfirmPassword: '',
  CanAccessAllLibraries: false,
  Folders: [],
  maxParentalRating: undefined,
  BlockUnratedItems: [],
  BlockedTags: []
});
const tab = ref<number>(1);
const blockingCategories = computed(() =>
  [
    {
      label: t('books'),
      value: 'Book'
    },
    {
      label: t('channels'),
      value: 'ChannelContent'
    },
    {
      label: t('liveTv'),
      value: 'LiveTvChannel'
    },
    {
      label: t('movies'),
      value: 'Movie'
    },
    {
      label: t('music'),
      value: 'Music'
    },
    {
      label: t('trailer'),
      value: 'Trailer'
    },
    {
      label: t('shows'),
      value: 'Series'
    }]
);

/**
 * Loads all data required for this page
 */
async function load(): Promise<void> {
  const { id } = route.params;

  user.value = (await remote.sdk.newUserApi(getUserApi).getUserById({
    userId: id
  })).data;
  initializeUser();
  libraries.value = (await remote.sdk.newUserApi(getLibraryApi).getMediaFolders({ isHidden: false })).data;

  const cats = (await remote.sdk.newUserApi(getLocalizationApi).getParentalRatings()).data;

  for (const cat of cats) {
    if (parentalCategories.value.some(c => c.id === cat.Value!)) {
      parentalCategories.value = parentalCategories.value.map((c) => {
        if (c.id === cat.Value!) {
          return { label: `${c.label}/${cat.Name!}`, id: cat.Value };
        }

        return c;
      });
    } else {
      parentalCategories.value.push({ label: cat.Name!, id: cat.Value! });
    }
  }
}

await load();

/**
 * Saves the changed user access
 */
async function saveAccess(): Promise<void> {
  if (!user.value.Id) {
    return;
  }

  loading.value = true;
  await remote.sdk.newUserApi(getUserApi).updateUserPolicy({
    userId: user.value.Id,
    userPolicy: { ...user.value.Policy as UserPolicy, EnableAllFolders: model.value.CanAccessAllLibraries, EnabledFolders: model.value.Folders }
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
    userDto: { ...user.value, Name: model.value.Name }
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
      ...user.value.Policy as UserPolicy,
      MaxParentalRating: model.value.maxParentalRating,
      BlockUnratedItems: model.value.BlockUnratedItems
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

  if (!model.value.Password || model.value.Password !== model.value.ConfirmPassword) {
    useSnackbar(t('bothPasswordsSame'), 'error');

    return;
  }

  loading.value = true;
  await remote.sdk.newUserApi(getUserApi).updateUserPassword({ userId: user.value.Id, updateUserPassword: { NewPw: model.value.Password, ...(user.value.HasPassword && { CurrentPw: model.value.ConfirmPassword }) } });
  model.value = { ...model.value, CurrentPassword: '', Password: '', ConfirmPassword: '' };
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
async function deleteUser(): Promise<void> {
  await useConfirmDialog(async () => {
    await remote.sdk.newUserApi(getUserApi).deleteUser({ userId: user.value.Id! });
    await router.push('/settings/users');
  }, {
    title: t('deleteUser'),
    text: t('deleteUserConfirm'),
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
  await remote.sdk.newUserApi(getUserApi).updateUserPassword({ userId: user.value.Id, updateUserPassword: {
    ResetPassword: true
  } });
  await refreshData();
  loading.value = false;
}

/**
 * This function makes sure that all properties are defined
 */
function initializeUser(): void {
  model.value = {
    ...model.value,
    CanAccessAllLibraries: user.value.Policy?.EnableAllFolders ?? false,
    Name: user.value.Name ?? '',
    Folders: user.value.Policy?.EnabledFolders ?? [],
    maxParentalRating: user.value.Policy?.MaxParentalRating ?? undefined,
    BlockUnratedItems: user.value.Policy?.BlockUnratedItems ?? [],
    BlockedTags: user.value.Policy?.BlockedTags ?? []
  };
}
</script>
