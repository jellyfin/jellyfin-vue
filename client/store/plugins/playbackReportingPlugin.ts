import { Plugin } from 'vuex';
import { AppState } from '..';
import { PlaybackStatus } from '../playbackManager';
import { msToTicks } from '~/mixins/timeUtils';

export const playbackReportingPlugin: Plugin<AppState> = (store) => {
  store.subscribe((mutation, state: AppState) => {
    switch (mutation.type) {
      case 'playbackManager/INCREASE_QUEUE_INDEX':
      case 'playbackManager/DECREASE_QUEUE_INDEX':
      case 'playbackManager/SET_CURRENT_ITEM_INDEX':
        // Report playback stop for the previous item
        if (
          state.playbackManager.currentTime !== null &&
          store.getters['playbackManager/getPreviousItem']
        ) {
          store.$api.playState.reportPlaybackStopped(
            {
              playbackStopInfo: {
                ItemId: store.getters['playbackManager/getPreviousItem']?.Id,
                PlaySessionId: state.playbackManager.playSessionId,
                PositionTicks: msToTicks(
                  state.playbackManager.currentTime * 1000
                )
              }
            },
            { progress: false }
          );
        }

        // Then report the start of the next one
        if (store.getters['playbackManager/getCurrentItem']) {
          store.$api.playState.reportPlaybackStart(
            {
              playbackStartInfo: {
                CanSeek: true,
                ItemId: store.getters['playbackManager/getCurrentItem']?.Id,
                PlaySessionId: state.playbackManager.playSessionId,
                MediaSourceId: state.playbackManager.currentMediaSource?.Id,
                AudioStreamIndex: state.playbackManager.currentAudioStreamIndex,
                SubtitleStreamIndex:
                  state.playbackManager.currentSubtitleStreamIndex
              }
            },
            { progress: false }
          );
        }

        store.dispatch('playbackManager/setLastProgressUpdate', {
          progress: new Date().getTime()
        });
        break;
      case 'playbackManager/SET_CURRENT_TIME': {
        if (state.playbackManager.status === PlaybackStatus.playing) {
          const now = new Date().getTime();

          if (
            store.getters['playbackManager/getCurrentItem'] &&
            now - state.playbackManager.lastProgressUpdate > 1000 &&
            state.playbackManager.currentTime !== null
          ) {
            store.$api.playState.reportPlaybackProgress(
              {
                playbackProgressInfo: {
                  ItemId: store.getters['playbackManager/getCurrentItem']?.Id,
                  PlaySessionId: state.playbackManager.playSessionId,
                  IsPaused: false,
                  PositionTicks: Math.round(
                    msToTicks(state.playbackManager.currentTime * 1000)
                  )
                }
              },
              { progress: false }
            );

            store.dispatch('playbackManager/setLastProgressUpdate', {
              progress: new Date().getTime()
            });
          }
        }

        break;
      }
      case 'playbackManager/STOP_PLAYBACK':
        if (state.playbackManager.currentTime !== null) {
          store.$api.playState.reportPlaybackStopped(
            {
              playbackStopInfo: {
                ItemId: store.getters['playbackManager/getPreviousItem']?.Id,
                PlaySessionId: state.playbackManager.playSessionId,
                PositionTicks: msToTicks(
                  state.playbackManager.currentTime * 1000
                )
              }
            },
            { progress: false }
          );

          store.dispatch('playbackManager/setLastProgressUpdate', {
            progress: 0
          });
        }

        break;
      case 'playbackManager/PAUSE_PLAYBACK':
        if (state.playbackManager.currentTime !== null) {
          store.$api.playState.reportPlaybackProgress(
            {
              playbackProgressInfo: {
                ItemId: store.getters['playbackManager/getCurrentItem']?.Id,
                PlaySessionId: state.playbackManager.playSessionId,
                IsPaused: true,
                PositionTicks: Math.round(
                  msToTicks(state.playbackManager.currentTime * 1000)
                )
              }
            },
            { progress: false }
          );

          store.dispatch('playbackManager/setLastProgressUpdate', {
            progress: new Date().getTime()
          });
        }

        break;
    }
  });
};
