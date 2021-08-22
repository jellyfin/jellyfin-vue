import { BaseItemDto } from '@jellyfin/client-axios';
import { createLocalVue, mount, Wrapper } from '@vue/test-utils';
import Vuetify from 'vuetify';
import Vuex, { Store } from 'vuex';
import Vue from 'vue';
import MarkPlayedButton from '../MarkPlayedButton.vue';

describe('component: MarkPlayedButton', () => {
  const localVue = createLocalVue();
  let vuetify: Vuetify;
  let store: Store<unknown>;
  let wrapper: Wrapper<Vue>;

  beforeEach(() => {
    vuetify = new Vuetify();
    store = new Vuex.Store({});
    wrapper = mount(MarkPlayedButton, {
      localVue,
      vuetify,
      store,
      propsData: {
        item: { Type: 'Series' } as BaseItemDto
      }
    });
  });

  it('shows a v-btn with check icon', (): void => {
    expect(wrapper.find('.mdi-check').exists()).toBe(true);
    expect(wrapper.find('.v-btn--icon').exists()).toBe(true);
  });

  it('check color is primary when the item has been watched', async (): Promise<void> => {
    await wrapper.setProps({
      item: { UserData: { Played: true }, Type: 'Series' } as BaseItemDto
    });

    expect(wrapper.find('.primary--text').exists()).toBe(true);
  });

  it('check color is unset when the item has been watched', async (): Promise<void> => {
    await wrapper.setProps({
      item: { UserData: { Played: false }, Type: 'Series' } as BaseItemDto
    });

    expect(wrapper.find('.primary--text').exists()).toBe(false);
  });

  it('check color changes, when the props are updated', async (): Promise<void> => {
    await wrapper.setProps({
      item: { UserData: { Played: true }, Type: 'Series' } as BaseItemDto
    });

    expect(wrapper.find('.primary--text').exists()).toBe(true);

    await wrapper.setProps({
      item: { UserData: { Played: false }, Type: 'Series' } as BaseItemDto
    });

    expect(wrapper.find('.primary--text').exists()).toBe(false);
  });
});
