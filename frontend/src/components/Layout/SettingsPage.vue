<template>
  <VContainer>
    <VRow v-if="$slots.title">
      <VCol>
        <VRow class="mt-4 mx-0 mb-2 justify-space-between">
          <h2 class="text-h4">
            <slot name="title" />
          </h2>
          <div>
            <slot name="actions" />
          </div>
        </VRow>
      </VCol>
    </VRow>
    <VRow>
      <slot name="content" />
    </VRow>
  </VContainer>
</template>
