<template>
  <div :data-src="src" class="absolute lazyImage lazy-hidden" />
</template>

<script lang="ts">
import Vue from 'vue';

declare global {
  interface Window {
    isScrollingFast: boolean;
  }
}

window.isScrollingFast = false;

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
      elem.classList.add('lazy-fadein');
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
  elem.classList.remove('lazy-fadein');
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
      requestAnimationFrame(() => {
        fillImageElement(target, source);
      });
    }
  }
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach(
    (entry) => {
      onIntersect(entry);
    },
    { rootMargin: '25%' }
  );
});

function disconnectObserverOnFastScroll(obs: IntersectionObserver): void {
  obs.disconnect();
}

function reconnectObserverOnSlowScroll(
  obs: IntersectionObserver,
  elems: Array<Element>
): void {
  obs.disconnect();
  elems.forEach((elem) => obs.observe(elem));
}

function hideFastScrollElements(): void {
  requestAnimationFrame(() => {
    const targets: Element[] = Array.from(
      document.getElementsByClassName('lazyScroll')
    );
    targets.forEach((target) => {
      target.classList.add('lazy-hidden', 'lazy-fadein');
    });
  });
}

function showFastScrollElements(): void {
  requestAnimationFrame(() => {
    const targets: Element[] = Array.from(
      document.getElementsByClassName('lazyScroll')
    );
    targets.forEach((target) => {
      target.classList.remove('lazy-hidden');
    });
  });
}

let lastScrollY = 0;
let scrollMeasureTimeout: number;
let directionTop: boolean;
const latestScrollMeasures: Array<boolean> = [false, false, false, false];
const observedTargets: Array<Element> = [];

/**
 * Measure the scroll speed based on the delta between scroll positions.
 */
function measureScrollSpeed(): void {
  const scrollY = window.scrollY;
  const previousDirection = directionTop;
  requestAnimationFrame(() => {
    if (window.pageYOffset < lastScrollY) {
      directionTop = true;
    } else {
      directionTop = false;
    }

    if (directionTop !== previousDirection) {
      lastScrollY = scrollY;
      window.clearTimeout(scrollMeasureTimeout);
      latestScrollMeasures.push(false);
    } else {
      const scrollDelta = Math.abs(scrollY - lastScrollY);
      if (scrollDelta >= 200 && lastScrollY !== 0) {
        latestScrollMeasures.push(true);
      } else {
        latestScrollMeasures.push(false);
      }
    }
    latestScrollMeasures.shift();

    const allTrue = (bool: boolean) => bool === true;
    if (latestScrollMeasures.every(allTrue)) {
      window.isScrollingFast = true;
      disconnectObserverOnFastScroll(observer);
      hideFastScrollElements();
    } else {
      window.isScrollingFast = false;
      reconnectObserverOnSlowScroll(observer, observedTargets);
      showFastScrollElements();
    }

    lastScrollY = scrollY;
    window.clearTimeout(scrollMeasureTimeout);
    scrollMeasureTimeout = window.setTimeout(() => {
      if (lastScrollY === window.scrollY) {
        window.isScrollingFast = false;
        reconnectObserverOnSlowScroll(observer, observedTargets);
        showFastScrollElements();
      }
    }, 500);
  });
}
window.addEventListener('scroll', measureScrollSpeed);

export default Vue.extend({
  props: {
    src: {
      type: String,
      required: true
    }
  },
  mounted() {
    observer.observe(this.$el);
    observedTargets.push(this.$el);
  },
  destroyed() {
    observer.unobserve(this.$el);
    observedTargets.splice(observedTargets.indexOf(this.$el), 1);
  }
});
</script>

<style lang="scss">
.lazyImage {
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  opacity: 1;
}

.lazy-fadein {
  opacity: 1;
  transition: opacity 0.15s;
}

.lazy-hidden {
  opacity: 0;
}
</style>
