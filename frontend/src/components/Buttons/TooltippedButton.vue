<template>
  <v-tooltip v-bind="tooltipProps">
    <template #activator="{ props: tooltipInstanceProps }">
      <slot v-bind="mergeProps(tooltipInstanceProps, buttonProps)" />
    </template>
  </v-tooltip>
</template>

<script setup lang="ts">
import { AllowedComponentProps, Component, mergeProps, VNodeProps } from 'vue';
import { VBtn, VTooltip } from 'vuetify/components';

/**
 * We need any for proper type inference here
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ComponentProps<C extends Component> = C extends new (...args: any) => any
  ? Omit<
      InstanceType<C>['$props'],
      keyof VNodeProps | keyof AllowedComponentProps
    >
  : never;

defineProps<{
  tooltipProps: ComponentProps<typeof VTooltip>;
  buttonProps: ComponentProps<typeof VBtn>;
}>();
</script>
