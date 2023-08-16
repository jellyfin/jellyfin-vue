<template>
  <LoadingIndicator />
  <VMain class="h-100">
    <RouterViewTransition />
  </VMain>
  <VFooter
    app
    color="transparent">
    <LocaleSwitcher
      top
      elevated />
  </VFooter>
</template>
