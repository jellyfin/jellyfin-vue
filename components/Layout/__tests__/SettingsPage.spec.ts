import { mount } from '@vue/test-utils';
import SettingsPage from '~/components/Layout/SettingsPage.vue';

const $t = (str: string): string => str;

const wrapper = mount(SettingsPage, {
  propsData: {
    pageTitle: 'test-page-title'
  },
  mocks: {
    $t
  },
  slots: {
    actions: '<p>This is a demo action</p>',
    content: '<p>This is the demo content</p>'
  }
});

describe('SettingsPage', () => {
  test('shows content, action and title if all are defined', () => {
    expect(wrapper.text()).toContain('test-page-title');
    expect(wrapper.text()).toContain('This is a demo action');
    expect(wrapper.text()).toContain('This is the demo content');
  });

  test('shows only the content if the title is undefined.', async () => {
    await wrapper.setProps({ pageTitle: undefined });

    expect(wrapper.text()).toEqual(
      expect.not.stringContaining('test-page-title')
    );

    expect(wrapper.text()).toEqual(
      expect.not.stringContaining('This is a demo action')
    );

    expect(wrapper.text()).toContain('This is the demo content');
  });
});
