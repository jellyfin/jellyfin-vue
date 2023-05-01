export { usei18n } from './use-i18n';
export { useLoading } from './use-loading';
export { useRemote } from './use-remote';
export { useVuetify } from './use-vuetify';
export { useResponsiveClasses } from './use-responsive-classes';
export { useDateFns } from './use-datefns';
export { useRouter } from './use-router';
/**
 * == COMPONENT COMPOSABLES ==
 *
 * The definition of these composables are in the relevant components themselves,
 * so the code that tracks the sate of the component are alongside the component itself.
 *
 * We could re-define these functrions in this folder as well, but we would lose access to the
 * JSDoc of the original functions
 */
export { useConfirmDialog } from '@/components/Dialogs/ConfirmDialog.vue';
export { useSnackbar } from '@/components/System/Snackbar.vue';
