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

describe('Play button', () => {
  it('Button should be visible with text "play"', (): void => {
    expect(wrapper.find('.v-btn').exists()).toBe(true);
    expect(wrapper.text()).toBe('play');
  });

  it('Button should be disabled if item is not playable', (): void => {
    expect(wrapper.find('.v-btn--disabled').exists()).toBe(true);
    expect(wrapper.text()).toBe('play');
  });

  it('Button should not be disabled if item is playable', async (): Promise<void> => {
    await wrapper.setProps({ item: { Type: 'MusicGenre' } as BaseItemDto });

    expect(wrapper.find('.v-btn--disabled').exists()).toBe(false);
  });

  it('Button should show "resume" if item can be resumed', async (): Promise<void> => {
    await wrapper.setProps({
      item: { UserData: { PlaybackPositionTicks: 1 } } as BaseItemDto
    });

    expect(wrapper.text()).toBe('resume');
  });

  it('When button is pressed, "play" action is called.', async (): Promise<void> => {
    await wrapper.setProps({
      item: {
        Id: 'test-id-1',
        Type: 'MusicGenre',
        UserData: { PlaybackPositionTicks: 0 }
      } as BaseItemDto
    });

    await wrapper.findComponent({ name: 'v-btn' }).trigger('click');

    expect(spy.getCall(0).args[1].items).toMatchObject([
      {
        Id: 'test-id-1',
        UserData: { PlaybackPositionTicks: 0 }
      }
    ]);

    // Since PlaybackPositionTicks = 0, item should be played not resumed
    expect(typeof spy.getCall(0).args[1].items[0].startFromTile).toBe(
      'undefined'
    );
  });

  it('When button is pressed, "resume" action is called.', async (): Promise<void> => {
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
