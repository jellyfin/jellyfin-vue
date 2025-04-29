<template>
  <SettingsPage>
    <template #title>
      {{ t('users') }}
    </template>
    <template #actions>
      <VBtn
        color="primary"
        variant="elevated"
        class="ml-a"
        @click="$router.push('/settings/users/new')">
        {{ t('newUser') }}
      </VBtn>
      <VBtn
        variant="elevated"
        href="https://jellyfin.org/docs/general/server/users/adding-managing-users"
        rel="noreferrer noopener"
        target="_blank">
        {{ t('help') }}
      </VBtn>
    </template>
    <template #content>
      <VContainer>
        <VRow class="space">
          <VCard
            v-for="user in users"
            :key="user.Id"
            class="pa-2"
            @click="$router.push(`/settings/users/${user['Id']}`)">
            <VRow>
              <VCol>
                <UserImage
                  :user="user"
                  :size="48" />
              </VCol>
              <VCol>
                <VCardTitle class="pa-0 fixed-width">
                  {{ user.Name }}
                </VCardTitle>
                <VCardSubtitle
                  v-if="user.LastActivityDate"
                  class="pa-0 fixed-width">
                  {{
                    $t('lastActivityDate', {
                      value: useDateFns(formatDistanceToNow, new Date(user.LastActivityDate), { addSuffix: true })
                    })
                  }}
                </VCardSubtitle>
              </VCol>
            </VRow>
          </VCard>
        </VRow>
      </VContainer>
    </template>
  </SettingsPage>
</template>

<route lang="yaml">
meta:
  admin: true
</route>

<script setup lang="ts">
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'i18next-vue';
import { useDateFns } from '#/composables/use-datefns';
import { useApi } from '#/composables/apis';

const { t } = useTranslation();

const { data: users } = await useApi(getUserApi, 'getUsers')(() => ({}));
</script>

<style scoped>
.space {
  gap: 0.5rem;
}

.fixed-width {
  width: 200px;
  text-overflow: ellipsis;
}
</style>
