import type { Meta, StoryObj } from '@storybook/vue3';
import { JAvatar, JAvatarFallback, JAvatarImage, JIcon } from '#/components/index.ts';

const docs = (description: string, code: string) => ({
  docs: {
    description: { story: description },
    source: {
      code,
      language: 'html',
      type: 'code'
    }
  }
});

const meta: Meta<typeof JAvatar> = {
  tags: ['autodocs'],
  component: JAvatar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays an image, initials, or an icon in a fixed-size avatar. `JAvatarImage` and `JAvatarFallback` follow the shadcn/Reka composition model.'
      }
    }
  },
  subcomponents: {
    JAvatarImage,
    JAvatarFallback
  },
  args: {
    color: 'primary',
    rounded: true,
    size: 48
  },
  argTypes: {
    color: {
      control: 'select',
      options: ['card', 'error', 'primary', 'secondary', 'success', 'warning'],
      description: 'Semantic Jellyfin theme color. Unlike Vuetify, arbitrary CSS colors are not supported.',
      table: {
        category: 'JAvatar',
        defaultValue: { summary: 'undefined' },
        type: { summary: 'string' }
      }
    },
    rounded: {
      control: 'boolean',
      description: 'Makes the avatar circular. Set to `false` for the square equivalent of Vuetify’s `tile` variant.',
      table: {
        category: 'JAvatar',
        defaultValue: { summary: 'true' },
        type: { summary: 'boolean' }
      }
    },
    size: {
      control: {
        min: 16,
        max: 160,
        step: 8,
        type: 'number'
      },
      description: 'Width and height in pixels. Default is 48px.',
      table: {
        category: 'JAvatar',
        defaultValue: { summary: '48' },
        type: { summary: 'number' }
      }
    }
  }
};

export default meta;

type Story = StoryObj<typeof JAvatar>;

export const Default: Story = {
  parameters: docs('Avatar with an icon fallback. Use this when no image is available.', `
<JAvatar
  color="primary"
  :size="48">
  <JAvatarFallback>
    <JIcon class="i-mdi:account" />
  </JAvatarFallback>
</JAvatar>`),
  render: args => ({
    components: { JAvatar, JAvatarFallback, JIcon },
    setup: () => ({ args }),
    template: `
      <div>
        <JAvatar v-bind="args">
          <JAvatarFallback>
            <JIcon class="i-mdi:account" />
          </JAvatarFallback>
        </JAvatar>
      </div>
    `
  })
};

export const Square: Story = {
  args: {
    color: 'card',
    rounded: false,
    size: 96
  },
  parameters: docs('A square avatar, corresponding to Vuetify’s `tile` variation.', `
<JAvatar
  color="card"
  :rounded="false"
  :size="96">
  <JAvatarFallback>
    <JIcon class="i-mdi:image" />
  </JAvatarFallback>
</JAvatar>`),
  render: args => ({
    components: { JAvatar, JAvatarFallback, JIcon },
    setup: () => ({ args }),
    template: `
      <div>
        <JAvatar v-bind="args">
          <JAvatarFallback>
            <JIcon class="i-mdi:image" />
          </JAvatarFallback>
        </JAvatar>
      </div>
    `
  })
};

export const Image: Story = {
  parameters: docs('The standard shadcn/Reka composition: an image followed by a fallback.', `
<JAvatar
  color="primary"
  :size="48">
  <JAvatarImage
    src="https://github.com/shadcn.png"
    alt="@shadcn" />
  <JAvatarFallback>CN</JAvatarFallback>
</JAvatar>`),
  render: args => ({
    components: { JAvatar, JAvatarFallback, JAvatarImage },
    setup: () => ({ args }),
    template: `
      <div>
        <JAvatar v-bind="args">
          <JAvatarImage
            src="https://github.com/shadcn.png"
            alt="@shadcn" />
          <JAvatarFallback>CN</JAvatarFallback>
        </JAvatar>
      </div>
    `
  })
};

export const Sizes: Story = {
  tags: ['!dev'],
  parameters: {
    controls: { disable: true },
    ...docs('Examples of explicit pixel sizes.', `
<JAvatar :size="24" color="primary"><JAvatarFallback><JIcon class="i-mdi:account" /></JAvatarFallback></JAvatar>
<JAvatar :size="48" color="primary"><JAvatarFallback><JIcon class="i-mdi:account" /></JAvatarFallback></JAvatar>
<JAvatar :size="96" color="primary"><JAvatarFallback><JIcon class="i-mdi:account" /></JAvatarFallback></JAvatar>`)
  },
  render: () => ({
    components: { JAvatar, JAvatarFallback, JIcon },
    template: `
      <div class="uno-flex uno-items-center uno-gap-4">
        <JAvatar :size="24" color="primary"><JAvatarFallback><JIcon class="i-mdi:account" /></JAvatarFallback></JAvatar>
        <JAvatar :size="48" color="primary"><JAvatarFallback><JIcon class="i-mdi:account" /></JAvatarFallback></JAvatar>
        <JAvatar :size="96" color="primary"><JAvatarFallback><JIcon class="i-mdi:account" /></JAvatarFallback></JAvatar>
      </div>
    `
  })
};

export const ThemeColors: Story = {
  tags: ['!dev'],
  parameters: {
    controls: { disable: true },
    ...docs('Semantic colors from the Jellyfin theme palette.', `
<JAvatar color="primary"><JAvatarFallback><JIcon class="i-mdi:account" /></JAvatarFallback></JAvatar>
<JAvatar color="success"><JAvatarFallback><JIcon class="i-mdi:check" /></JAvatarFallback></JAvatar>
<JAvatar color="warning"><JAvatarFallback><JIcon class="i-mdi:alert" /></JAvatarFallback></JAvatar>
<JAvatar color="error"><JAvatarFallback><JIcon class="i-mdi:close" /></JAvatarFallback></JAvatar>`)
  },
  render: () => ({
    components: { JAvatar, JAvatarFallback, JIcon },
    template: `
      <div class="uno-flex uno-items-center uno-gap-4">
        <JAvatar color="primary"><JAvatarFallback><JIcon class="i-mdi:account" /></JAvatarFallback></JAvatar>
        <JAvatar color="success"><JAvatarFallback><JIcon class="i-mdi:check" /></JAvatarFallback></JAvatar>
        <JAvatar color="warning"><JAvatarFallback><JIcon class="i-mdi:alert" /></JAvatarFallback></JAvatar>
        <JAvatar color="error"><JAvatarFallback><JIcon class="i-mdi:close" /></JAvatarFallback></JAvatar>
      </div>
    `
  })
};

export const Initials: Story = {
  parameters: {
    controls: { disable: true },
    ...docs('Text fallback when an image is unavailable.', `
<JAvatar
  color="secondary"
  class="uno-font-semibold uno-text-lg">
  <JAvatarFallback>PV</JAvatarFallback>
</JAvatar>`)
  },
  render: () => ({
    components: { JAvatar, JAvatarFallback },
    template: `
      <div>
        <JAvatar
          color="secondary"
          class="uno-font-semibold uno-text-lg">
          <JAvatarFallback>PV</JAvatarFallback>
        </JAvatar>
      </div>
    `
  })
};
