<template>
  <v-list>
    <v-list-group>
      <v-list-item
        v-for="linkItem in linkItems"
        :key="linkItem.name"
        rel="noreferrer noopener"
        :href="linkItem.link"
        target="_blank">
        <v-avatar>
          <v-icon :icon="linkItem.icon" />
        </v-avatar>
        <v-list-item-title>
          {{ linkItem.name }}
        </v-list-item-title>
        <v-list-item-action>
          <Icon>
            <i-mdi-open-in-new />
          </Icon>
        </v-list-item-action>
      </v-list-item>
    </v-list-group>
  </v-list>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import IMdiBook from '~icons/mdi/book';
import IMdiBug from '~icons/mdi/bug';
import IMdiRocketLaunch from '~icons/mdi/rocket-launch';
import IMdiTranslate from '~icons/mdi/translate';

const { t } = useI18n();

const linkItems = computed(() => {
  return [
    {
      icon: IMdiRocketLaunch,
      name: t('links.poweredByJellyfin'),
      link: 'https://jellyfin.org'
    },
    {
      icon: IMdiBook,
      name: t('links.readTheDocumentation'),
      link: 'https://docs.jellyfin.org'
    },
    {
      icon: IMdiTranslate,
      name: t('links.helpTranslate'),
      link: 'https://translate.jellyfin.org'
    },
    {
      icon: IMdiBug,
      name: t('links.reportAnIssue'),
      link: 'https://github.com/jellyfin/jellyfin-vue/issues/new'
    }
  ];
});
</script>
