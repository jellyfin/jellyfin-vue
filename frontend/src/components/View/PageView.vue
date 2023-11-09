<template>
  <RouterView v-slot="{ Component, route }">
    <TransitionView :transition-key="String(route.path)">
      <SuspenseView suspensible>
        <component :is="Component" />
      </SuspenseView>
    </TransitionView>
  </RouterView>
</template>
