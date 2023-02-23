import { computed, ComputedRef, ref } from 'vue';

const requests = ref(0);
const isLoading = computed(() => requests.value > 0);

/**
 * Certain request endpoints are not relevant to be tracked for progress.
 * Include them here
 */
export const excludedProgressEndpoints: readonly string[] = [
  '/Sessions/Playing',
  '/PlaybackInfo?',
  'clientSettings?',
  '/Videos/'
];

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
