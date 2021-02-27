import { BaseItemDto } from '@jellyfin/client-axios';
import { createLocalVue, mount, Wrapper } from '@vue/test-utils';
import Vuetify from 'vuetify';
import Vuex, { Store } from 'vuex';
import Vue from 'vue';
import LikeButton from '../LikeButton.vue';

describe('component: LikeButton', () => {
  const localVue = createLocalVue();
  let vuetify: Vuetify;
  let store: Store<unknown>;
  let wrapper: Wrapper<Vue>;

  beforeEach(() => {
    vuetify = new Vuetify();
    store = new Vuex.Store({});
  });

  // Item is 'favorited'
  it('shows a heart outline icon when the item is not favorited', (): void => {
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
  it('shows a heart icon when the item is favorited', (): void => {
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

  it('updates the icon when the IsFavorite user data is changed', async (): Promise<void> => {
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
