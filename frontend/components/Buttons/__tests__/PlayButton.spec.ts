import '@testing-library/jest-dom';
import { render, fireEvent } from '@testing-library/vue';
import PlayButton from '../PlayButton.vue';

const $t = (str: string): string => str;
const mockPlay = jest.fn();

const store = {
  modules: {
    playbackManager: {
      state: {},
      actions: {
        play: mockPlay
      },
      namespaced: true
    }
  }
};

afterEach((): void => {
  mockPlay.mockReset();
});

describe('component: PlayButton', () => {
  it('shows the text "play"', (): void => {
    const { getByRole } = render(PlayButton, {
      props: {
        item: {}
      },
      mocks: {
        $t
      },
      store
    });

    const button = getByRole('button');

    expect(button).toHaveTextContent('play');
  });

  it('is disabled if the item is not playable', (): void => {
    const { getByRole } = render(PlayButton, {
      props: {
        item: {}
      },
      mocks: {
        $t
      },
      store
    });

    const button = getByRole('button');

    expect(button).toBeDisabled();
  });

  it('is enabled if the item is playable', (): void => {
    const { getByRole } = render(PlayButton, {
      props: {
        item: {
          MediaType: 'Video'
        }
      },
      mocks: {
        $t
      },
      store
    });

    const button = getByRole('button');

    expect(button).not.toBeDisabled();
  });

  it('shows the text "resume" if item can be resumed', (): void => {
    const { getByRole } = render(PlayButton, {
      props: {
        item: {
          UserData: {
            PlaybackPositionTicks: 1000
          }
        }
      },
      mocks: {
        $t
      },
      store
    });

    const button = getByRole('button');

    expect(button).toHaveTextContent('resume');
  });

  it('calls the "play" action when clicked if the item is not resumable', async (): Promise<void> => {
    const { getByRole } = render(PlayButton, {
      props: {
        item: {
          MediaType: 'Video'
        }
      },
      mocks: {
        $t
      },
      store
    });

    await fireEvent.click(getByRole('button'));

    expect(mockPlay).toHaveBeenCalled();
  });

  it('calls the "play" action with shuffling enabled when clicked if the item is not resumable and the shuffle prop is set', async (): Promise<void> => {
    const { getByRole } = render(PlayButton, {
      props: {
        item: {
          MediaType: 'Video'
        },
        shuffle: true
      },
      mocks: {
        $t
      },
      store
    });

    await fireEvent.click(getByRole('button'));

    expect(mockPlay).toHaveBeenCalled();
    expect(mockPlay.mock.calls[0][1].startShuffled).toBeDefined();
    expect(mockPlay.mock.calls[0][1].startShuffled).toBeTruthy();
  });

  it('calls the "resume" action when clicked if the item is resumable', async (): Promise<void> => {
    const { getByRole } = render(PlayButton, {
      props: {
        item: {
          MediaType: 'Video',
          UserData: {
            PlaybackPositionTicks: 1000
          }
        }
      },
      mocks: {
        $t
      },
      store
    });

    await fireEvent.click(getByRole('button'));

    expect(mockPlay).toHaveBeenCalled();
    expect(mockPlay.mock.calls[0][1].startFromTime).toBeDefined();
  });
});
