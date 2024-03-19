import { computed, ref, watch, type ComputedRef } from 'vue';

const requests = ref(0);
const isLoading = computed(() => requests.value > 0);
const cssVarKey = '--j-client-cursor';

watch(isLoading, () => {
  isLoading.value ?
    window.document.documentElement.style.setProperty(cssVarKey, 'wait') :
    window.document.documentElement.style.removeProperty(cssVarKey);
});

/**
 * Composable for triggering the linear progress that appears at the top of the page
 * That progress bar is always indeterminate, so you can just start or stop requests
 *
 * For long running tasks (library refresh, config sync), use taskManager instead.
 * This is only meant for data fetch/push
 */
export function useLoading(): {
  start: () => number;
  finish: () => void;
  isLoading: ComputedRef<boolean>;
} {
  const start = (): number => requests.value++;
  const finish = (): void => {
    if (requests.value > 0) {
      requests.value--;
    }
  };

  return { start, finish, isLoading };
}
