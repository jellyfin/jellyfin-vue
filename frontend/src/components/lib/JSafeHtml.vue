<script lang="ts">
import { Static, createVNode, h } from 'vue';
import { sanitizeHtml } from '@/utils/html';

interface Props {
  html: string;
  markdown?: boolean;
}

const JSafeHtml = ({ html, markdown = false }: Props) => h(
  createVNode(Static, undefined, sanitizeHtml(html, markdown)),
  { key: `${html}_${markdown}` }
);

JSafeHtml.inheritAttrs = false;

export default JSafeHtml;
</script>
