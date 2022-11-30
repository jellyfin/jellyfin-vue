import { isNil } from 'lodash-es';
import { PiniaPluginContext } from 'pinia';
import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api';
import { playbackManagerStore, PlaybackStatus } from '~/store';
import { msToTicks } from '~/utils/time';
import { getImageInfo } from '~/utils/images';
import { useRemote } from '@/composables';

/**
 * Add or remove media handlers
 */
function handleMediaSession(
  playbackManager: ReturnType<typeof playbackManagerStore>,
  remove = false
): void {
  if (window.navigator.mediaSession) {
    const actionHandlers = {
      play: (): void => {
        playbackManager.unpause();
      },
      pause: (): void => {
        playbackManager.pause();
      },
      previoustrack: (): void => {
        playbackManager.setPreviousTrack();
      },
      nexttrack: (): void => {
        playbackManager.setNextTrack();
      },
      stop: (): void => {
        playbackManager.stop();
      },
      seekbackward: (): void => {
        playbackManager.skipBackward();
      },
      seekforward: (): void => {
        playbackManager.skipForward();
      },
      seekto: (action): void => {
        playbackManager.changeCurrentTime(action.seekTime || 1);
      }
    } as { [key in MediaSessionAction]?: MediaSessionActionHandler };

    for (const [action, handler] of Object.entries(actionHandlers)) {
      try {
        window.navigator.mediaSession.setActionHandler(
          action as MediaSessionAction,
          remove ? null : handler
        );
      } catch {
        console.error(`The media session action "${action}" is not supported.`);
      }
    }
  }
}

/**
 * Updates mediasession metadata based on the currently playing item
 */
function updateMediaSessionMetadata(
  playbackManager: ReturnType<typeof playbackManagerStore>
): void {
  if (window.navigator.mediaSession && !isNil(playbackManager.getCurrentItem)) {
    const mediaSessionMetadata = new MediaMetadata({
      title: playbackManager.getCurrentItem.Name || '',
      artist: playbackManager.getCurrentItem.AlbumArtist || '',
      album: playbackManager.getCurrentItem.Album || '',
      artwork: [
        {
          src:
            getImageInfo(playbackManager.getCurrentItem, {
              width: 96
            }).url || '',
          sizes: '96x96'
        },
        {
          src:
            getImageInfo(playbackManager.getCurrentItem, {
              width: 128
            }).url || '',
          sizes: '128x128'
        },
        {
          src:
            getImageInfo(playbackManager.getCurrentItem, {
              width: 192
            }).url || '',
          sizes: '192x192'
        },
        {
          src:
            getImageInfo(playbackManager.getCurrentItem, {
              width: 256
            }).url || '',
          sizes: '256x256'
        },
        {
          src:
            getImageInfo(playbackManager.getCurrentItem, {
              width: 384
            }).url || '',
          sizes: '384x384'
        },
        {
          src:
            getImageInfo(playbackManager.getCurrentItem, {
              width: 512
            }).url || '',
          sizes: '512x512'
        }
      ]
    });

    switch (playbackManager.status) {
      case PlaybackStatus.Playing: {
        window.navigator.mediaSession.playbackState = 'playing';
        window.navigator.mediaSession.metadata = mediaSessionMetadata;
        break;
      }
      case PlaybackStatus.Paused: {
        window.navigator.mediaSession.playbackState = 'paused';
        window.navigator.mediaSession.metadata = mediaSessionMetadata;
        break;
      }
      default: {
        window.navigator.mediaSession.playbackState = 'none';
        window.navigator.mediaSession.metadata = null;
        break;
      }
    }
  }
}

/**
 * Playback reporting logic
 *
 * Reports the state of the playback to the server
 */
export default function (context: PiniaPluginContext): void {
  const playbackManager = playbackManagerStore();

  playbackManager.$onAction(({ name, after }) => {
    // @ts-expect-error - Typings are not recognised properly here for some reason
    after(async () => {
      const remote = useRemote();

      switch (name) {
        case 'setNextTrack':
        case 'setPreviousTrack':
        case 'setCurrentIndex':
        case 'play': {
          if (name === 'play') {
            handleMediaSession(playbackManager);
          }

          updateMediaSessionMetadata(playbackManager);

          if (
            !isNil(playbackManager.currentTime) &&
            playbackManager.getPreviousItem
          ) {
            /**
             * Report stop for the previous item
             */
            await remote.sdk.newUserApi(getPlaystateApi).reportPlaybackStopped(
              {
                playbackStopInfo: {
                  ItemId: playbackManager.getPreviousItem?.Id,
                  PlaySessionId: playbackManager.playSessionId,
                  PositionTicks: msToTicks(playbackManager.currentTime * 1000)
                }
              },
              { progress: false }
            );

            playbackManager.setLastProgressUpdate(Date.now());
          }

          /**
           * And then report play for the next one if it exists
           */
          if (playbackManager.getCurrentItem) {
            await remote.sdk.newUserApi(getPlaystateApi).reportPlaybackStart(
              {
                playbackStartInfo: {
                  CanSeek: true,
                  ItemId: playbackManager.getCurrentItem?.Id,
                  PlaySessionId: playbackManager.playSessionId,
                  MediaSourceId: playbackManager.currentMediaSource?.Id,
                  AudioStreamIndex: playbackManager.currentAudioStreamIndex,
                  SubtitleStreamIndex:
                    playbackManager.currentSubtitleStreamIndex
                }
              },
              { progress: false }
            );

            playbackManager.setLastProgressUpdate(Date.now());
          }

          break;
        }
        case 'setCurrentTime': {
          if (playbackManager.status === PlaybackStatus.Playing) {
            const now = Date.now();

            if (
              playbackManager.getCurrentItem &&
              now - playbackManager.lastProgressUpdate >= 1250 &&
              !isNil(playbackManager.currentTime)
            ) {
              await remote.sdk
                .newUserApi(getPlaystateApi)
                .reportPlaybackProgress(
                  {
                    playbackProgressInfo: {
                      ItemId: playbackManager.getCurrentItem?.Id,
                      PlaySessionId: playbackManager.playSessionId,
                      IsPaused: playbackManager.isPaused,
                      PositionTicks: Math.round(
                        msToTicks(playbackManager.currentTime * 1000)
                      )
                    }
                  },
                  { progress: false }
                );

              playbackManager.setLastProgressUpdate(Date.now());
            }
          }

          break;
        }
        case 'stop':
        case 'clearQueue': {
          handleMediaSession(playbackManager, true);

          if (!isNil(playbackManager.currentTime)) {
            await remote.sdk.newUserApi(getPlaystateApi).reportPlaybackStopped(
              {
                playbackStopInfo: {
                  ItemId: playbackManager.getPreviousItem?.Id,
                  PlaySessionId: playbackManager.playSessionId,
                  PositionTicks: msToTicks(playbackManager.currentTime * 1000)
                }
              },
              { progress: false }
            );

            playbackManager.setLastProgressUpdate(0);
          }

          break;
        }
        case 'pause':
        case 'unpause':
        case 'playPause': {
          updateMediaSessionMetadata(playbackManager);

          if (!isNil(playbackManager.currentTime)) {
            await remote.sdk.newUserApi(getPlaystateApi).reportPlaybackProgress(
              {
                playbackProgressInfo: {
                  ItemId: playbackManager.getCurrentItem?.Id,
                  PlaySessionId: playbackManager.playSessionId,
                  IsPaused: playbackManager.isPaused,
                  PositionTicks: Math.round(
                    msToTicks(playbackManager.currentTime * 1000)
                  )
                }
              },
              { progress: false }
            );

            playbackManager.setLastProgressUpdate(Date.now());
          }

          break;
        }
      }
    });
  });
}
