import { Context } from '@nuxt/types';
import { playbackManagerStore, PlaybackStatus } from '~/store';
import { msToTicks } from '~/mixins/timeUtils';
import { isNil } from 'lodash';

/**
 * Playback reporting logic
 *
 * Reports the state of the playback to the server
 */
export default function watchPlaybackReporting(ctx: Context) {
  const playbackManager = playbackManagerStore();

  playbackManager.$onAction(({ name, after }) => {
    // @ts-expect-error - For some reason, types are not recognised properly here
    after(async () => {
      switch (name) {
        case 'setNextTrack':
        case 'setPreviousTrack':
        case 'setCurrentIndex':
        case 'play':
          if (
            !isNil(playbackManager.currentTime) &&
            playbackManager.getPreviousItem
          ) {
            /**
             * Report stop for the previous item
             */
            await ctx.$api.playState.reportPlaybackStopped(
              {
                playbackStopInfo: {
                  ItemId: playbackManager.getPreviousItem?.Id,
                  PlaySessionId: playbackManager.playSessionId,
                  PositionTicks: msToTicks(playbackManager.currentTime * 1000)
                }
              },
              { progress: false }
            );

            playbackManager.setLastProgressUpdate(new Date().getTime());
          }
          /**
           * And then report play for the next one if it exists
           */
          if (playbackManager.getCurrentItem) {
            await ctx.$api.playState.reportPlaybackStart(
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

            playbackManager.setLastProgressUpdate(new Date().getTime());
            break;
          }
        case 'setCurrentTime':
          if (playbackManager.status === PlaybackStatus.Playing) {
            const now = new Date().getTime();

            if (
              playbackManager.getCurrentItem &&
              now - playbackManager.lastProgressUpdate > 10000 &&
              !isNil(playbackManager.currentTime)
            ) {
              await ctx.$api.playState.reportPlaybackProgress(
                {
                  playbackProgressInfo: {
                    ItemId: playbackManager.getCurrentItem?.Id,
                    PlaySessionId: playbackManager.playSessionId,
                    IsPaused: false,
                    PositionTicks: Math.round(
                      msToTicks(playbackManager.currentTime * 1000)
                    )
                  }
                },
                { progress: false }
              );

              playbackManager.setLastProgressUpdate(new Date().getTime());
            }
          }

          break;
        case 'stop':
        case 'clearQueue':
          if (!isNil(playbackManager.currentTime)) {
            await ctx.$api.playState.reportPlaybackStopped(
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
        case 'pause':
        case 'unpause':
        case 'playPause':
          if (!isNil(playbackManager.currentTime)) {
            await ctx.$api.playState.reportPlaybackProgress(
              {
                playbackProgressInfo: {
                  ItemId: playbackManager.getCurrentItem?.Id,
                  PlaySessionId: playbackManager.playSessionId,
                  IsPaused:
                    playbackManager.status === PlaybackStatus.Playing
                      ? false
                      : true,
                  PositionTicks: Math.round(
                    msToTicks(playbackManager.currentTime * 1000)
                  )
                }
              },
              { progress: false }
            );

            playbackManager.setLastProgressUpdate(new Date().getTime());
            break;
          }
      }
    });
  });
}
