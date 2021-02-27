import { BaseItemDto } from '@jellyfin/client-axios';
import { mount } from '@vue/test-utils';
import sinon from 'sinon';
import Vuex from 'vuex';
import PlayButton from '../PlayButton.vue';

const $t = (str: string): string => str;

const spy = sinon.spy();

const actions = {
  play: spy
};

const store = new Vuex.Store({
  modules: {
    playbackManager: {
      state: {},
      actions,
      namespaced: true
    }
  }
});

const wrapper = mount(PlayButton, {
  propsData: {
    item: {}
  },
  mocks: {
    $t
  },
  store
});

describe('component: PlayButton', () => {
  it('shows the text "play"', (): void => {
    expect(wrapper.text()).toBe('play');
  });

  it('is disabled if the item is not playable', (): void => {
    expect(wrapper.find('.v-btn--disabled').exists()).toBe(true);
  });

  it('is enabled if the item is playable', async (): Promise<void> => {
    // TODO: This should mock canPlay in order to not depend on another file
    await wrapper.setProps({ item: { Type: 'MusicGenre' } as BaseItemDto });

    expect(wrapper.find('.v-btn--disabled').exists()).toBe(false);
  });

  it('shows the text "resume" if item can be resumed', async (): Promise<void> => {
    await wrapper.setProps({
      item: { UserData: { PlaybackPositionTicks: 1 } } as BaseItemDto
    });

    expect(wrapper.text()).toBe('resume');
  });

  it('calls the "play" action when clicked if the item is not resumable', async (): Promise<void> => {
    // TODO: This doesn't actually check which action is called
    // TODO: The store should be mocked to test in isolation
    await wrapper.setProps({
      item: {
        Id: 'test-id-1',
        Type: 'MusicGenre',
        UserData: { PlaybackPositionTicks: 0 }
      }
    });

    await wrapper.findComponent({ name: 'v-btn' }).trigger('click');

    expect(spy.getCall(0).args[1].items).toMatchObject([
      {
        Id: 'test-id-1',
        UserData: { PlaybackPositionTicks: 0 }
      }
    ]);
  });

  it('calls the "resume" action when clicked if the item is resumable', async (): Promise<void> => {
    // TODO: This doesn't actually check which action is called
    // TODO: The store should be mocked to test in isolation
    spy.resetHistory();
    await wrapper.setProps({
      item: {
        Id: 'test-id-2',
        Type: 'MusicGenre',
        UserData: { PlaybackPositionTicks: 100000000 }
      } as BaseItemDto
    });

    await wrapper.findComponent({ name: 'v-btn' }).trigger('click');

    expect(spy.getCall(0).args[1].items).toMatchObject([
      {
        Id: 'test-id-2',
        UserData: { PlaybackPositionTicks: 100000000 }
      }
    ]);

    expect(spy.getCall(0).args[1].startFromTime).toBe(10);
  });
});
