<template>
  <VContainer class="px-6">
    <VRow>
      <VCol
        cols="12"
        sm="8"
        md="9">
        <slot name="left" />
      </VCol>
      <VCol
        cols="12"
        sm="4"
        md="3">
        <slot name="right" />
      </VCol>
    </VRow>
  </VContainer>
</template>
