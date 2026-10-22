import type { Meta, StoryObj } from '@storybook/vue3';
import { shallowRef } from 'vue';
import JAnchor from '#/components/JAnchor.vue';

const meta: Meta<typeof JAnchor> = {
  component: JAnchor
};

export default meta;

type Story = StoryObj<typeof JAnchor>;

/**
 * By default, the content floats in the top layer, so it isn't clipped nor contained by the anchor's
 * ancestors (here, a container with overflow: hidden and a transform), like tooltips and menus need
 */
export const Floating: Story = {
  args: {
    open: true,
    position: 'top'
  },
  render: args => ({
    components: { JAnchor },
    setup: () => ({ args }),
    template: `
      <div style="position: relative; width: 16rem; height: 3rem; margin-top: 4rem; display: flex; align-items: center; justify-content: center; overflow: hidden; transform: translateZ(0); outline: 1px dashed;">
        <JAnchor v-bind="args" style="padding: 0.25rem 0.5rem; border-radius: 0.25rem; background: #333; color: white;">
          <button type="button">Anchor</button>
          <template #content>
            Content
          </template>
        </JAnchor>
      </div>`
  })
};

/**
 * With inPlace, the content belongs to the anchor, like this badge: it's positioned inside the anchor's
 * closest positioned ancestor (the dashed container) and it's clipped, scrolled and transformed along with it
 */
export const InPlace: Story = {
  args: {
    inPlace: true,
    open: true,
    position: 'top'
  },
  render: args => ({
    components: { JAnchor },
    setup: () => ({ args }),
    template: `
      <div style="position: relative; width: 16rem; height: 6rem; display: flex; align-items: center; justify-content: center; overflow: hidden; outline: 1px dashed;">
        <JAnchor v-bind="args" style="padding: 0 0.5rem; border-radius: 1rem; background: crimson; color: white;">
          <button type="button">Anchor</button>
          <template #content>
            Badge
          </template>
        </JAnchor>
      </div>`
  })
};

/**
 * Floating content shown and hidden with any JTransition (its defaults are used when transitionProps is omitted)
 */
export const Transition: Story = {
  args: {
    position: 'bottom',
    transitionProps: { name: 'slide-y' }
  },
  render: args => ({
    components: { JAnchor },
    setup: () => ({ args, open: shallowRef(false) }),
    template: `
      <JAnchor v-bind="args" :open style="padding: 0.25rem 0.5rem; border-radius: 0.25rem; background: #333; color: white;">
        <button type="button" @click="open = !open">Toggle</button>
        <template #content>
          Content
        </template>
      </JAnchor>`
  })
};
