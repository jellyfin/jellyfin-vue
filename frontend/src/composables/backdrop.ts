import { ImageType, type BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { toValue, type MaybeRefOrGetter } from 'vue';
import { useBackdrop } from '@/components/Layout/Backdrop.vue';
import { getBlurhash } from '@/utils/images';

/**
 * Same as useBackdrop, but is a shorthand for items only.
 */
export function useItemBackdrop(item: MaybeRefOrGetter<Nullish<BaseItemDto>>, ...args: ExcludeFromTuple<Parameters<typeof useBackdrop>, 0>) {
  useBackdrop(() => getBlurhash(toValue(item) ?? {}, ImageType.Backdrop), ...args);
}

/**
 * == COMPONENT COMPOSABLE ==
 *
 * The definition of the composable are in the relevant component,
 * so the code that tracks the state of the component are alongside the component itself.
 *
 * We could re-define it here, but we would lose access to the
 * JSDoc of the original: that's why we just re-export it again.
 */
export { useBackdrop } from '@/components/Layout/Backdrop.vue';
