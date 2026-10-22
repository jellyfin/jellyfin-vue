import type { Meta, StoryObj } from '@storybook/vue3';
import { darkColors, lightColors } from '@jellyfin-vue/configs/uno/colors';
import { JApp, JTooltip } from '#/components/index.ts';

const positions = ['top', 'bottom', 'left', 'right'] as const;
const theme = {
  isDark: true,
  colors: {
    dark: darkColors(),
    light: lightColors()
  },
  typography: 'sans-serif',
  transitionDuration: 0.2
};

const meta: Meta<typeof JTooltip> = {
  component: JTooltip,
  args: {
    text: 'Tooltip'
  },
  decorators: [
    () => ({
      components: { JApp },
      setup: () => ({ theme }),
      template: '<JApp :theme="theme" :loading="false"><story /></JApp>'
    })
  ]
};

export default meta;

type Story = StoryObj<typeof JTooltip>;

export const Positions: Story = {
  render: args => ({
    components: { JTooltip },
    setup: () => ({ args, positions }),
    template: `
      <div style="display: flex; gap: 2rem; justify-content: center; padding: 6rem;">
        <JTooltip
          v-for="position in positions"
          :key="position"
          :text="args.text"
          :position>
          <button type="button">{{ position }}</button>
        </JTooltip>
      </div>`
  })
};

/**
 * Reproduces the app bar: a bar that clips its content (overflow: hidden) and traps fixed
 * descendants (transform), with the activators next to the edge of the viewport.
 * The tooltips must be displayed below the buttons, inside the viewport (so "top" flips).
 */
export const ClippedBar: Story = {
  parameters: {
    layout: 'fullscreen'
  },
  args: {
    text: 'A long tooltip that has to shift to stay inside the viewport'
  },
  render: args => ({
    components: { JTooltip },
    setup: () => ({ args }),
    template: `
      <div style="position: fixed; inset: 0 0 auto; height: 48px; display: flex; justify-content: flex-end; align-items: center; gap: 4px; overflow: hidden; transform: translateY(0);">
        <JTooltip :text="args.text" position="bottom">
          <button type="button">Bottom</button>
        </JTooltip>
        <JTooltip :text="args.text" position="top">
          <button type="button">Top</button>
        </JTooltip>
      </div>`
  }),
  play: async ({ canvas, userEvent }) => {
    await userEvent.hover(canvas.getByRole('button', { name: 'Top' }));
  }
};
