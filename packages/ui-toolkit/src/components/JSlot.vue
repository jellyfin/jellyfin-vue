<script lang="ts">
import { addProps } from '@skirtle/vue-vnode-utils';
import type { SetupContext } from 'vue';

const JSlot = (_: object, { slots, attrs }: SetupContext) => addProps(slots.default?.() ?? [], () => ({ ...attrs }));

export default JSlot;
</script>
