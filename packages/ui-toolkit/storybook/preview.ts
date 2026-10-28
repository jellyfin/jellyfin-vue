import type { Preview } from '@storybook/vue3';
import { lightColors } from '@jellyfin-vue/configs/uno/colors';
import Color from 'color';
import { h } from 'vue';
import 'uno.css';

const themeStyle: Record<string, string> = {};

for (const [color, value] of Object.entries(lightColors())) {
  themeStyle[`--j-theme-color-${color}`] = Color(value).rgb().array().join(', ');
  themeStyle[`--j-theme-color-${color}-text`] = `lch(from rgb(var(--j-theme-color-${color})) calc((49.44 - l) * infinity) 0 0)`;
}

const preview: Preview = {
  parameters: {
    controls: {
      expanded: true
    },
    docs: {
      codePanel: true
    }
  },
  decorators: [
    story => () => h('div', { style: themeStyle }, [h(story())])
  ]
};

export default preview;
