import type { Meta, StoryObj } from '@storybook/vue3';
import { JProgressCircular } from '#/components';

const meta: Meta<typeof JProgressCircular> = {
  component: JProgressCircular
};

export default meta;

type Story = StoryObj<typeof JProgressCircular>;

export const Default: Story = {
  args: {
    indeterminate: false,
    value: 0
  }
};
