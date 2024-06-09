<script lang="ts">
import { sanitizeHtml } from '@/utils/html';

interface Props {
  html: string;
  markdown?: boolean;
}

const JSafeHtml = (props: Props) => sanitizeHtml(props.html, props.markdown);

JSafeHtml.inheritAttrs = false;

export default JSafeHtml;
</script>
