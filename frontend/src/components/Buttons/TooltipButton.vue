<template>
  <v-tooltip v-bind="$props.tooltip">
    <template #activator="{ props: tooltipActivator }">
      <v-btn
        v-if="$slots.default"
        v-bind="{ ...$attrs, ...tooltipActivator, ...$props.btn }">
        <slot />
      </v-btn>
      <v-btn
        v-else
        v-bind="{ ...$attrs, ...tooltipActivator, ...$props.btn }" />
    </template>
  </v-tooltip>
</template>

<script setup lang="ts">
import { VBtn, VTooltip } from 'vuetify/components';

type VBtnProps = InstanceType<typeof VBtn>['$props'];
type VTooltipProps = InstanceType<typeof VTooltip>['$props'];

defineProps<{
  btn?: VBtnProps;
  tooltip?: VTooltipProps;
}>();
</script>
