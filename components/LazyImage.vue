<template>
  <div :data-src="src" class="absolute lazyImage lazy-hidden" />
</template>

<script lang="ts">
import Vue from 'vue';

/**
 * Swaps a data-src attribute with a div's "background-image: url()" style property.
 *
 * @param {HTMLElement} elem - DOM node of the target div element
 * @param {string} url - url of the image
 *
 */
function fillImageElement(elem: HTMLElement, url: string): void {
  const preloaderImg = new Image();
  preloaderImg.src = url;

  preloaderImg.addEventListener('load', () => {
    requestAnimationFrame(() => {
      elem.style.backgroundImage = "url('" + url + "')";
      elem.removeAttribute('data-src');
      elem.classList.remove('lazy-hidden');
      elem.classList.add('lazy-image-fadein');
    });
  });
}

/**
 * Swaps a div's "background-image: url()" style property with a data-src attribute.
 *
 * @param {HTMLElement} elem - DOM node of the target div element
 *
 */
function emptyImageElement(elem: HTMLElement): void {
  const url = elem.style.backgroundImage.slice(4, -1).replace(/"/g, '');
  elem.style.backgroundImage = 'none';
  elem.setAttribute('data-src', url);
  elem.classList.remove('lazy-image-fadein');
  elem.classList.add('lazy-hidden');
}

/**
 * Global callback function for all the observed lazy loaded images
 *
 * @param {IntersectionObserverEntry} entry - entry of the intersected element.
 */
function onIntersect(entry: IntersectionObserverEntry): void {
  const target = entry.target as HTMLElement;
  const isIntersecting = entry.isIntersecting;

  if (target) {
    const source = target.getAttribute('data-src');
    if (!isIntersecting && !source) {
      requestAnimationFrame(() => {
        emptyImageElement(target);
      });
    } else if (source && isIntersecting) {
      fillImageElement(target, source);
    }
  }
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    onIntersect(entry);
  });
});

export default Vue.extend({
  props: {
    src: {
      type: String,
      required: true
    }
  },
  mounted() {
    observer.observe(this.$el);
  },
  destroyed() {
    observer.unobserve(this.$el);
  }
});
</script>

<style lang="scss" scoped>
.absolute {
  height: 100%;
  width: 100%;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
.lazy-image {
  background-position: center;
  background-size: cover;
}

.lazy-image-fadein {
  opacity: 1;
  transition: opacity 0.15s;
}

.lazy-hidden {
  opacity: 0;
}

@keyframes fadein {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>
