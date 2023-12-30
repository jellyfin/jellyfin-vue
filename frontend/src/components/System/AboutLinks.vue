<template>
  <VList>
    <VItemGroup>
      <VListItem
        v-for="linkItem in linkItems"
        :key="linkItem.name"
        :href="linkItem.link"
        rel="noreferrer noopener"
        target="_blank">
        <template #prepend>
          <VAvatar>
            <VIcon :icon="linkItem.icon" />
          </VAvatar>
        </template>
        <VListItemTitle>
          {{ linkItem.name }}
        </VListItemTitle>
        <template #append>
          <VListItemAction>
            <VIcon>
              <IMdiOpenInNew />
            </VIcon>
          </VListItemAction>
        </template>
      </VListItem>
    </VItemGroup>
  </VList>
</template>

<script setup lang="ts">
import IMdiBook from 'virtual:icons/mdi/book';
import IMdiBug from 'virtual:icons/mdi/bug';
import IMdiRocketLaunch from 'virtual:icons/mdi/rocket-launch';
import IMdiTranslate from 'virtual:icons/mdi/translate';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const linkItems = computed(() => {
  return [
    {
      icon: IMdiRocketLaunch,
      name: t('poweredByJellyfin'),
      link: 'https://jellyfin.org'
    },
    {
      icon: IMdiBook,
      name: t('readTheDocumentation'),
      link: 'https://docs.jellyfin.org'
    },
    {
      icon: IMdiTranslate,
      name: t('helpTranslate'),
      link: 'https://translate.jellyfin.org'
    },
    {
      icon: IMdiBug,
      name: t('reportAnIssue'),
      link: 'https://github.com/jellyfin/jellyfin-vue/issues/new'
    }
  ];
});
</script>
