import { BaseItemDto } from '@jellyfin/client-axios';
import { createLocalVue, mount, Wrapper } from '@vue/test-utils';
import Vuetify from 'vuetify';
import Vuex, { Store } from 'vuex';
import Vue from 'vue';
import LikeButton from '../LikeButton.vue';

describe('Like button', () => {
  const localVue = createLocalVue();
  let vuetify: Vuetify;
  let store: Store<unknown>;
  let wrapper: Wrapper<Vue>;

  beforeEach(() => {
    vuetify = new Vuetify();
    store = new Vuex.Store({});
  });

  // Item is 'favorited'
  it('Heart outline is shown when item is not favorited', (): void => {
    wrapper = mount(LikeButton, {
      localVue,
      vuetify,
      store,
      propsData: {
        item: {} as BaseItemDto
      }
    });

    expect(wrapper.find('.mdi').exists()).toBe(true);
    expect(wrapper.find('.mdi-heart-outline').exists()).toBe(true);
    expect(wrapper.find('.v-btn--icon').exists()).toBe(true);
    expect(wrapper.find('.red--text').exists()).toBe(false);
  });

  // Item is not 'favorited'
  it('Solid heart is shown when item is favorited', (): void => {
    wrapper = mount(LikeButton, {
      localVue,
      vuetify,
      store,
      propsData: {
        item: { UserData: { IsFavorite: true } } as BaseItemDto
      }
    });

    expect(wrapper.find('.mdi').exists()).toBe(true);
    expect(wrapper.find('.mdi-heart').exists()).toBe(true);
    expect(wrapper.find('.v-btn--icon').exists()).toBe(true);
    expect(wrapper.find('.red--text').exists()).toBe(true);
  });

  it('Icon updates when props change', async (): Promise<void> => {
    wrapper = mount(LikeButton, {
      localVue,
      vuetify,
      store,
      propsData: {
        item: { UserData: { IsFavorite: false } } as BaseItemDto
      }
    });
    expect(wrapper.find('.mdi-heart-outline').exists()).toBe(true);

    await wrapper.setProps({
      item: { UserData: { IsFavorite: true } } as BaseItemDto
    });

    expect(wrapper.find('.mdi-heart').exists()).toBe(true);
  });
});
