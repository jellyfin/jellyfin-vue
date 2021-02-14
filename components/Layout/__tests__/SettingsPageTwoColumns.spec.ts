import { mount } from '@vue/test-utils';
import SettingsPageTwoColumns from '~/components/Layout/SettingsPageTwoColumns.vue';

const $t = (str: string): string => str;

const wrapper = mount(SettingsPageTwoColumns, {
  propsData: {
    leftTitle: 'left-column-title',
    rightTitle: 'right-column-title'
  },
  mocks: {
    $t
  },
  slots: {
    leftContent: '<p>Lorem Ipsum</p>',
    rightContent: '<p>Dolor Sit Amet</p>'
  }
});

describe('SettingsPageTwoColumns', () => {
  test('shows content and title if the titles are defined', () => {
    expect(wrapper.text()).toContain('test-page-title');
    expect(wrapper.text()).toContain('test-page-title');

    expect(wrapper.text()).toContain('Lorem Ipsum');
    expect(wrapper.text()).toContain('Dolor Sit Amet');
  });

  test('shows only the content if the titles are undefined', async () => {
    await wrapper.setProps({ leftTitle: undefined, rightTitle: undefined });

    expect(wrapper.text()).toEqual(
      expect.not.stringContaining('left-column-title')
    );
    expect(wrapper.text()).toEqual(
      expect.not.stringContaining('right-column-title')
    );

    expect(wrapper.text()).toContain('Lorem Ipsum');
    expect(wrapper.text()).toContain('Dolor Sit Amet');
  });
});
