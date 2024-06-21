<script lang="ts">
import { h } from 'vue';
import { sanitizeHtml } from '@/utils/html';

interface Props {
  html: string;
  markdown?: boolean;
}

const JSafeHtml = (props: Props) => h('j-safe-html', { innerHTML: sanitizeHtml(props.html, props.markdown) });

JSafeHtml.inheritAttrs = false;

export default JSafeHtml;
</script>
