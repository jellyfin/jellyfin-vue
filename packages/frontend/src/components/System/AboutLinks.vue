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
            <JIcon :class="linkItem.icon" />
          </VAvatar>
        </template>
        <VListItemTitle>
          {{ linkItem.name }}
        </VListItemTitle>
        <template #append>
          <VListItemAction>
            <JIcon
              class="i-mdi:open-in-new" />
          </VListItemAction>
        </template>
      </VListItem>
    </VItemGroup>
  </VList>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTranslation } from 'i18next-vue';

const { t } = useTranslation();

const linkItems = computed(() => {
  return [
    {
      icon: 'i-mdi:rocket-launch',
      name: t('poweredByJellyfin'),
      link: 'https://jellyfin.org'
    },
    {
      icon: 'i-mdi:book',
      name: t('readTheDocumentation'),
      link: 'https://docs.jellyfin.org'
    },
    {
      icon: 'i-mdi:translate',
      name: t('helpTranslate'),
      link: 'https://translate.jellyfin.org'
    },
    {
      icon: 'i-mdi:bug',
      name: t('reportAnIssue'),
      link: 'https://github.com/jellyfin/jellyfin-vue/issues/new'
    }
  ];
});
</script>
