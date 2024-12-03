<template>
  <span
    class="uno-w-10 uno-h-10"
    :role="$attrs.onClick ? 'button' : undefined"
    :aria-hidden="!!$attrs.onClick"
    :tabindex="$attrs.onClick ? 0 : undefined"
    v-bind="$attrs" />
</template>
