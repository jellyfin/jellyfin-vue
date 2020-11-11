<template>
  <div :data-src="src" class="absolute lazyImage lazy-hidden" />
</template>

<script lang="ts">
import Vue from 'vue';

let observerInterface: IntersectionObserver;

export default Vue.extend({
  props: {
    src: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      observer: observerInterface,
      intersected: false
    };
  },
  mounted() {
    this.observer = new IntersectionObserver(this.onIntersect, {
      rootMargin: '25%'
    });
    this.observer.observe(this.$el);
  },
  destroyed() {
    this.observer.disconnect();
  },
  methods: {
    fillImageElement(elem: HTMLElement, url: string) {
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
    },
    emptyImageElement(elem: HTMLElement) {
      const url = elem.style.backgroundImage.slice(4, -1).replace(/"/g, '');
      elem.style.backgroundImage = 'none';
      elem.setAttribute('data-src', url);
      elem.classList.remove('lazy-image-fadein');
      elem.classList.add('lazy-hidden');
    },
    onIntersect(entryArray: Array<IntersectionObserverEntry>) {
      for (const entry of entryArray) {
        const target = entry.target as HTMLElement;
        const isIntersecting = entry.isIntersecting;

        if (target) {
          const source = target.getAttribute('data-src');
          if (!isIntersecting && !source) {
            requestAnimationFrame(() => {
              this.emptyImageElement(target);
            });
          } else if (source && isIntersecting) {
            this.fillImageElement(target, source);
          }
        }
      }
    }
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
