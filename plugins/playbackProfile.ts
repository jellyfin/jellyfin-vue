import { Plugin } from '@nuxt/types/app';
import { browserDetector } from './browserDetection';
import {
  getSupportedMP4VideoCodecs,
  hasVp8Support
} from '~/utils/mp4VideoFormats';
import { getSupportedMP4AudioCodecs } from '~/utils/mp4AudioFormats';
import { getSupportedVPXVideoCodecs } from '~/utils/vpxVideoFormats';
import { getSupportedWebMAudioCodecs } from '~/utils/webmAudioFormats';
import { getSupportedAudioCodecs } from '~/utils/audioFormats';
import { canPlayNativeHls, hasMkvSupport } from '~/utils/transcodingFormats';
import { getHlsVideoCodecs, getHlsAudioCodecs } from '~/utils/hlsFormats';
import { getCodecProfiles } from '~/utils/codecProfiles';
import {
  DeviceProfile,
  DirectPlayProfile,
  DlnaProfileType,
  TranscodingProfile,
  EncodingContext,
  SubtitleProfile,
  SubtitleDeliveryMethod,
  ResponseProfile
} from '~/api';

declare module '@nuxt/types' {
  interface Context {
    $playbackProfile: DeviceProfile;
  }

  interface NuxtAppOptions {
    $playbackProfile: DeviceProfile;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $playbackProfile: DeviceProfile;
  }
}

declare module 'vuex/types/index' {
  interface Store<S> {
    $playbackProfile: DeviceProfile;
  }
}

const physicalAudioChannels = browserDetector.isTv() ? 6 : 2;

const videoTestElement = document.createElement('video');

/**
 * Returns a valid DirectPlayProfile for the current platform.
 *
 * @returns {Array<DirectPlayProfile>} An array of direct play profiles for the current platform.
 */
function getDirectPlayProfiles(): Array<DirectPlayProfile> {
  const DirectPlayProfiles = [];

  const mp4VideoCodecs = getSupportedMP4VideoCodecs(videoTestElement);
  const mp4AudioCodecs = getSupportedMP4AudioCodecs(videoTestElement);
  const vpxVideoCodecs = getSupportedVPXVideoCodecs(videoTestElement);
  const webmAudioCodecs = getSupportedWebMAudioCodecs(videoTestElement);

  DirectPlayProfiles.push({
    Container: 'webm',
    Type: DlnaProfileType.Video,
    AudioCodec: webmAudioCodecs.join(','),
    VideoCodec: vpxVideoCodecs.join(',')
  });

  DirectPlayProfiles.push({
    Container: 'mp4,m4v',
    Type: DlnaProfileType.Video,
    VideoCodec: mp4VideoCodecs.join(','),
    AudioCodec: mp4AudioCodecs.join(',')
  });

  const supportedAudio = [
    'opus',
    'mp3',
    'mp2',
    'aac',
    'flac',
    'alac',
    'webma',
    'wma',
    'wav',
    'ogg',
    'oga'
  ];

  for (const audioFormat of supportedAudio) {
    if (audioFormat === 'mp2') {
      DirectPlayProfiles.push({
        Container: 'mp2,mp3',
        Type: DlnaProfileType.Audio,
        AudioCodec: audioFormat
      });
    } else if (audioFormat === 'mp3') {
      DirectPlayProfiles.push({
        Container: audioFormat,
        Type: DlnaProfileType.Audio,
        AudioCodec: audioFormat
      });
    } else {
      DirectPlayProfiles.push({
        Container: audioFormat === 'webma' ? 'webma,webm' : audioFormat,
        Type: DlnaProfileType.Audio
      });
    }

    // aac also appears in the m4a and m4b container
    if (audioFormat === 'aac' || audioFormat === 'alac') {
      DirectPlayProfiles.push({
        Container: 'm4a,m4b',
        AudioCodec: audioFormat,
        Type: DlnaProfileType.Audio
      });
    }
  }

  return DirectPlayProfiles;
}

/**
 * Returns a valid TranscodingProfile for the current platform.
 *
 * @returns {Array<TranscodingProfile>} An array of transcoding profiles for the current platform.
 */
function getTranscodingProfiles(): Array<TranscodingProfile> {
  const TranscodingProfiles = [];

  const hlsBreakOnNonKeyFrames = !!(
    browserDetector.isApple() ||
    browserDetector.isEdge() ||
    !canPlayNativeHls(videoTestElement)
  );

  if (
    canPlayNativeHls(videoTestElement) ||
    browserDetector.supportsMediaSource()
  ) {
    TranscodingProfiles.push({
      Container:
        !canPlayNativeHls(videoTestElement) ||
        browserDetector.isEdge() ||
        browserDetector.isAndroid()
          ? 'ts'
          : 'aac',
      Type: DlnaProfileType.Audio,
      AudioCodec: 'aac',
      Context: EncodingContext.Streaming,
      Protocol: 'hls',
      MaxAudioChannels: physicalAudioChannels.toString(),
      MinSegments: browserDetector.isApple() ? 2 : 1,
      BreakOnNonKeyFrames: hlsBreakOnNonKeyFrames
    });
  }

  ['aac', 'mp3', 'opus', 'wav']
    .filter(getSupportedAudioCodecs)
    .forEach(function (audioFormat) {
      TranscodingProfiles.push({
        Container: audioFormat,
        Type: DlnaProfileType.Audio,
        AudioCodec: audioFormat,
        Context: EncodingContext.Streaming,
        Protocol: 'http',
        MaxAudioChannels: physicalAudioChannels.toString()
      });
    });

  const mp4VideoCodecs = getSupportedMP4VideoCodecs(videoTestElement);
  const mp4AudioCodecs = getSupportedMP4AudioCodecs(videoTestElement);

  if (hasMkvSupport(videoTestElement) && !browserDetector.isTizen()) {
    TranscodingProfiles.push({
      Container: 'mkv',
      Type: DlnaProfileType.Video,
      AudioCodec: mp4AudioCodecs.join(','),
      VideoCodec: mp4VideoCodecs.join(','),
      Context: EncodingContext.Streaming,
      MaxAudioChannels: physicalAudioChannels.toString(),
      CopyTimestamps: true
    });
  }

  const hlsVideoAudioCodecs = getHlsAudioCodecs(videoTestElement);

  if (
    canPlayNativeHls(videoTestElement) ||
    (browserDetector.supportsMediaSource() && hlsVideoAudioCodecs.length)
  ) {
    TranscodingProfiles.push({
      Container: 'ts',
      Type: DlnaProfileType.Video,
      AudioCodec: hlsVideoAudioCodecs.join(','),
      VideoCodec: getHlsVideoCodecs(videoTestElement).join(','),
      Context: EncodingContext.Streaming,
      Protocol: 'hls',
      MaxAudioChannels: physicalAudioChannels.toString(),
      MinSegments: browserDetector.isApple() ? 2 : 1,
      BreakOnNonKeyFrames: hlsBreakOnNonKeyFrames
    });
  }

  if (hasVp8Support(videoTestElement)) {
    TranscodingProfiles.push({
      Container: 'webm',
      Type: DlnaProfileType.Video,
      AudioCodec: 'vorbis',
      VideoCodec: 'vpx',
      Context: EncodingContext.Streaming,
      Protocol: 'http',
      // If audio transcoding is needed, limit channels to number of physical audio channels
      // Trying to transcode to 5 channels when there are only 2 speakers generally does not sound good
      MaxAudioChannels: physicalAudioChannels.toString()
    });
  }

  return TranscodingProfiles;
}

/**
 * Returns a valid SubtitleProfile for the current platform.
 *
 * @returns {Array<SubtitleProfile>} An array of subtitle profiles for the current platform.
 */
function getSubtitleProfiles(): Array<SubtitleProfile> {
  const SubtitleProfiles = [];

  SubtitleProfiles.push({
    Format: 'vtt',
    Method: SubtitleDeliveryMethod.External
  });

  return SubtitleProfiles;
}

/**
 * Returns a valid ResponseProfile for the current platform.
 *
 * @returns {Array<ResponseProfile>} An array of subtitle profiles for the current platform.
 */
function getResponseProfiles(): Array<ResponseProfile> {
  const ResponseProfiles = [];

  ResponseProfiles.push({
    Type: DlnaProfileType.Video,
    Container: 'm4v',
    MimeType: 'video/mp4'
  });

  return ResponseProfiles;
}

/**
 * Creates a device profile containing supported codecs for the active Cast device.
 *
 * @returns {object} Device profile.
 */
function getDeviceProfile(): DeviceProfile {
  // MaxStaticBitrate seems to be for offline sync only
  return {
    MaxStreamingBitrate: 120000000,
    MaxStaticBitrate: 0,
    MusicStreamingTranscodingBitrate: Math.min(120000000, 192000),
    DirectPlayProfiles: getDirectPlayProfiles(),
    TranscodingProfiles: getTranscodingProfiles(),
    ContainerProfiles: [],
    CodecProfiles: getCodecProfiles(videoTestElement),
    SubtitleProfiles: getSubtitleProfiles(),
    ResponseProfiles: getResponseProfiles()
  };
}

const playbackProfilePlugin: Plugin = (_context, inject) => {
  inject('playbackProfile', getDeviceProfile());
};

export default playbackProfilePlugin;
