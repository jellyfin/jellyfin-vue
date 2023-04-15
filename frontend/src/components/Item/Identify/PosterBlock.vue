<template>
  <div class="poster-block" title="Poster Image">
    <div class="img-contain">
      <div
        class="d-flex justify-center align-center img-poster"
        :style="{
          backgroundImage: url ? `url(${url})` : undefined
        }" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ url?: string }>();
</script>

<style lang="scss" scoped>
.poster-block {
  contain: layout style;
  position: relative;

  & .img-contain {
    display: block;
    width: 100%;

    max-height: 300px;
    height: 300px;
    aspect-ratio: 2 / 3;
    cursor: pointer;

    & .img-poster {
      contain: strict;
      height: 100%;
      width: 100%;
      background-position: 50%;
      background-size: cover;
      background-clip: content-box;
      background-repeat: no-repeat;
      position: relative;
    }
  }
}
</style>
