<script setup lang="ts">
import { Comment, h } from 'vue';

/**
 * Unknown routes render the default layout without any content
 */
defineOptions({
  render: () => h(Comment)
});
</script>
