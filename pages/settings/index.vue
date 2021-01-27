<template>
  <settings-page page-title="settings.about">
    <template #content>
      <v-img
        contain
        src="/icon-transparent.svg"
        :alt="$t('jellyfinLogo')"
        class="logo"
      />
      <about-links />
    </template>
  </settings-page>
</template>

<style lang="scss" scoped>
.logo {
  max-width: 40%;
  margin: 0 auto;
}
</style>
