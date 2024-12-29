/**
 * == COMPONENT COMPOSABLE ==
 *
 * The definition of the composable are in the relevant component,
 * so the code that tracks the sate of the component are alongside the component itself.
 *
 * We could re-define it here, but we would lose access to the
 * JSDoc of the original: that's why we just re-export it again.
 */
export { useSnackbar } from '#/components/System/Snackbar.vue';
