<script lang="ts">
import { Static, createVNode, h } from 'vue';
import { sanitizeHtml } from '@/utils/html';

interface Props {
  html: string;
  markdown?: boolean;
}

const JSafeHtml = (props: Props) => h(
  createVNode(Static, undefined, sanitizeHtml(props.html, Boolean(props.markdown))),
  { key: props.html }
);

JSafeHtml.inheritAttrs = false;

export default JSafeHtml;
</script>
