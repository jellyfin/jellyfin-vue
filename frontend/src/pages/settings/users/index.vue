<template>
  <SettingsPage page-title="settings.users.users">
    <template #actions>
      <VBtn
        color="primary"
        variant="elevated"
        class="ml-a"
        @click="$router.push('/settings/users/new')">
        {{ t('settings.users.new') }}
      </VBtn>
      <VBtn
        variant="elevated"
        href="https://jellyfin.org/docs/general/server/users/adding-managing-users"
        rel="noreferrer noopener"
        target="_blank">
        {{ t('settings.help') }}
      </VBtn>
    </template>
    <template #content>
      <VCol>
        <VTable>
          <thead>
            <tr>
              <th
                v-for="{ text, value } in headers"
                :id="value"
                :key="value">
                {{ text }}
              </th>
              <th scope="col">
              <!--for avatar-->
              </th>
              <th scope="col">
              <!--for edit btn-->
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in users"
              :key="user.Id ?? undefined">
              <td
                v-for="{ value } in headers"
                :key="value">
                {{
                  value !== 'LastActivityDate'
                    ? user[value]
                    : useDateFns(
                      formatRelative,
                      parseJSON(user[value] ?? "2023-02-02T02:02:02Z"), //FIXME: using 'unknown' doesnt work here? its used somewhere else in the code as well, does that even work there?
                      new Date()
                    ).value
                }}
              </td>
              <td>
                <VImg
                  :src="`${remote.sdk.api?.basePath}/Users/${user['Id']}/Images/Primary?height=50&tag=${user['PrimaryImageTag']}&quality=90`"
                  height="50px"
                  width="auto" />
              </td>
              <td>
                <VBtn
                  color="primary"
                  @click="$router.push(`/settings/users/${user['Id']}`)">
                  {{ t('settings.users.edit') }}
                </VBtn>
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCol>
    </template>
  </SettingsPage>
</template>

<route lang="yaml">
meta:
  admin: true
</route>

<script setup lang="ts">
import { UserDto } from '@jellyfin/sdk/lib/generated-client';
import { getUserApi } from '@jellyfin/sdk/lib/utils/api/user-api';
import { formatRelative, parseJSON } from 'date-fns';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDateFns, useRemote } from '@/composables';

const { t } = useI18n();
const remote = useRemote();

const users = ref(
  (await remote.sdk.newUserApi(getUserApi).getUsers()).data ?? []
);

const headers = computed<{ text: string; value: keyof UserDto }[]>(() => [
  {
    text: t('username'),
    value: 'Name'
  },
  {
    text: t('settings.users.lastActivityDate'),
    value: 'LastActivityDate'
  }
]);
</script>
