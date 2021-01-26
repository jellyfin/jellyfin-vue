<template>
  <div>
    <v-img
      contain
      src="/icon-transparent.svg"
      :alt="$t('jellyfinLogo')"
      class="logo"
    />
    <about-links />
  </div>
</template>

<style lang="scss" scoped>
.logo {
  max-width: 40%;
  margin: 0 auto;
}
</style>
