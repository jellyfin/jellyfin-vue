<template>
  <VDialog
    max-width="30%"
    :model-value="!isNil(person)"
    @update:model-value="emit('close')">
    <VCard>
      <VCardTitle>{{ t('editPerson') }}</VCardTitle>
      <VDivider />
      <VCardText class="pa-3">
        <VRow>
          <VCol cols="4">
            <VAvatar
              size="160"
              class="ml-2">
              <JImg
                :src="
                  person?.Id && getItemImageUrl(person.Id, ImageType.Primary)
                "
                :alt="$t('person')">
                <template #placeholder>
                  <JIcon
                    class="bg-grey-darken-3 i-mdi:account" />
                </template>
              </JImg>
            </VAvatar>
          </VCol>
          <VCol>
            <VForm
              v-if="editState"
              @submit.prevent="onSubmit">
              <VTextField
                v-model="editState.Name"
                variant="outlined"
                :label="t('name')" />
              <VSelect
                v-model="editState.Type"
                :items="options"
                :label="t('type')"
                item-title="text"
                item-value="value"
                variant="outlined" />
              <VTextField
                v-if="editState.Type === 'Actor'"
                v-model="editState.Role"
                variant="outlined"
                :label="t('role')" />
            </VForm>
          </VCol>
        </VRow>
      </VCardText>
      <VDivider />
      <VCardActions
        class="d-flex align-center pa-3"
        :class="{
          'justify-end': !$vuetify.display.mobile,
          'justify-center': $vuetify.display.mobile
        }">
        <VSpacer />
        <VBtn
          variant="flat"
          width="8em"
          class="mr-1"
          @click="emit('close')">
          {{ t('cancel') }}
        </VBtn>
        <VBtn
          variant="flat"
          width="8em"
          color="primary"
          @click="onSubmit">
          {{ t('save') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { type BaseItemPerson, ImageType } from '@jellyfin/sdk/lib/generated-client';
import { watchImmediate } from '@vueuse/core';
import { isNil } from '@jellyfin-vue/shared/validation';
import { getItemImageUrl } from '#/utils/images';

const { person } = defineProps<{ person: BaseItemPerson | undefined }>();

const emit = defineEmits<{
  'update:person': [person: BaseItemPerson];
  'close': [];
}>();

const { t } = useI18n();

const editState = ref<BaseItemPerson>();
const options = computed(() => [
  { text: t('actor'), value: 'Actor' },
  { text: t('composer'), value: 'Composer' },
  { text: t('director'), value: 'Director' },
  { text: t('guestStar'), value: 'GuestStar' },
  { text: t('producer'), value: 'Producer' },
  { text: t('writer'), value: 'Writer' }
]);

watchImmediate(
  () => person,
  () => {
    editState.value = { ...person };
  }
);

/**
 * Handles saving person changes
 */
function onSubmit(): void {
  if (!editState.value) {
    return;
  }

  emit('update:person', editState.value);
}
</script>
