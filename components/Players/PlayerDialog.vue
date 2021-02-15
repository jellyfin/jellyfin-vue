<script lang="ts">
import Vue from 'vue';
import { VDialog } from 'vuetify/lib';
// @ts-expect-error - These typings are not declared
import { keyCodes } from 'vuetify/lib/util/helpers';

export default Vue.extend({
  extends: VDialog,
  methods: {
    // Copy of https://github.com/vuetifyjs/vuetify/blob/master/packages/vuetify/src/mixins/overlayable/index.ts#L129-L152
    // A block preventing scroll on the overlay has been removed, since we always want to scroll.
    scrollListener(e: WheelEvent & KeyboardEvent): void {
      if (e.type === 'keydown') {
        if (
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(
            (e.target as Element).tagName
          ) ||
          // https://github.com/vuetifyjs/vuetify/issues/4715
          (e.target as HTMLElement).isContentEditable
        )
          return;

        const up = [keyCodes.up, keyCodes.pageup];
        const down = [keyCodes.down, keyCodes.pagedown];

        if (up.includes(e.keyCode)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (e as any).deltaY = -1;
        } else if (down.includes(e.keyCode)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (e as any).deltaY = 1;
        }
      }
    }
  }
});
</script>
