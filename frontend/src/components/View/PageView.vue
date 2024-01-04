<template>
  <RouterView v-slot="{ Component, route }">
    <TransitionView :transition-key="String(route.path)">
      <Suspense suspensible>
        <component :is="Component" />
      </Suspense>
    </TransitionView>
  </RouterView>
</template>
