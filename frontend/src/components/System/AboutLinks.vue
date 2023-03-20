<template>
  <v-list>
    <v-item-group>
      <v-list-item
        v-for="linkItem in linkItems"
        :key="linkItem.name"
        :href="linkItem.link"
        rel="noreferrer noopener"
        target="_blank">
        <template #prepend>
          <v-avatar>
            <v-icon :icon="linkItem.icon" />
          </v-avatar>
        </template>
        <v-list-item-title>
          {{ linkItem.name }}
        </v-list-item-title>
        <template #append>
          <v-list-item-action>
            <v-icon>
              <i-mdi-open-in-new />
            </v-icon>
          </v-list-item-action>
        </template>
      </v-list-item>
    </v-item-group>
  </v-list>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import IMdiBook from 'virtual:icons/mdi/book';
import IMdiBug from 'virtual:icons/mdi/bug';
import IMdiRocketLaunch from 'virtual:icons/mdi/rocket-launch';
import IMdiTranslate from 'virtual:icons/mdi/translate';

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
