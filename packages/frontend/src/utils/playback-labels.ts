/**
 * Names of the playback methods and of the reasons of a change, for the notices, the quality menu and the playback
 * statistics. The translation function is passed in, so components keep their reactive one.
 */
import type { PlaybackChangeReason } from '#/store/playback-quality.ts';
import type { PlaybackMethod } from '#/utils/playback-capabilities/verdict.ts';

type Translate = (key: string, options?: Record<string, unknown>) => string;

/**
 * The name of a playback method
 */
export function getPlaybackMethodName(t: Translate, method: PlaybackMethod): string {
  switch (method) {
    case 'DirectPlay': {
      return t('playbackMethodDirectPlay');
    }
    case 'Remux': {
      return t('playbackMethodRemux');
    }
    case 'TranscodeAudio': {
      return t('playbackMethodTranscodeAudio');
    }
    case 'TranscodeVideo': {
      return t('playbackMethodTranscodeVideo');
    }
    case 'Unplayable': {
      return t('playbackMethodUnplayable');
    }
  }
}

/**
 * Why the method or the quality changed
 */
export function getPlaybackChangeReasonName(t: Translate, reason: PlaybackChangeReason): string {
  switch (reason) {
    case 'mediaError': {
      return t('playbackChangeMediaError');
    }
    case 'hlsMediaError': {
      return t('playbackChangeHlsMediaError');
    }
    case 'hlsCodecError': {
      return t('playbackChangeHlsCodecError');
    }
    case 'noPicture': {
      return t('playbackChangeNoPicture');
    }
    case 'noFrames': {
      return t('playbackChangeNoFrames');
    }
    case 'manual': {
      return t('playbackChangeManual');
    }
    case 'notSmooth': {
      return t('playbackChangeNotSmooth');
    }
    case 'networkDown': {
      return t('playbackChangeNetworkDown');
    }
    case 'networkUp': {
      return t('playbackChangeNetworkUp');
    }
  }
}
