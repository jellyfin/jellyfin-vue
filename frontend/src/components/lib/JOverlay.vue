<template>
  <JTransition>
    <div
      v-bind="$attrs"
      class="absolute-cover uno-z-100 uno-h-full uno-w-full">
      <slot />
    </div>
  </JTransition>
</template>

<style scoped>
.absolute-cover {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>
