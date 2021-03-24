import {
  DlnaProfileType,
  EncodingContext,
  TranscodingProfile
} from '@jellyfin/client-axios';
import { Context } from '@nuxt/types';
import { getSupportedAudioCodecs } from './helpers/audioFormats';
import { getSupportedFmp4AudioCodecs } from './helpers/fmp4AudioFormats';
import { getSupportedFmp4VideoCodecs } from './helpers/fmp4VideoFormats';
import { getSupportedMP4AudioCodecs } from './helpers/mp4AudioFormats';
import {
  getSupportedMP4VideoCodecs,
  hasVp8Support
} from './helpers/mp4VideoFormats';
import {
  canPlayNativeHls,
  canPlayHlsWithMSE,
  hasMkvSupport
} from './helpers/transcodingFormats';
import { getSupportedTsAudioCodecs } from './helpers/tsAudioFormats';
import { getSupportedTsVideoCodecs } from './helpers/tsVideoFormats';

/**
 * Returns a valid TranscodingProfile for the current platform.
 *
 * @param {Context} context - Nuxt context
 * @param {HTMLVideoElement} videoTestElement - A HTML video element for testing codecs
 * @returns {Array<TranscodingProfile>} An array of transcoding profiles for the current platform.
 */
export function getTranscodingProfiles(
  context: Context,
  videoTestElement: HTMLVideoElement
): Array<TranscodingProfile> {
  const TranscodingProfiles = [] as TranscodingProfile[];
  const physicalAudioChannels = context.$browser.isTv() ? 6 : 2;

  const hlsBreakOnNonKeyFrames = !!(
    context.$browser.isApple() ||
    (context.$browser.isEdge() && !context.$browser.isChromiumBased()) ||
    !canPlayNativeHls(context, videoTestElement)
  );

  const mp4AudioCodecs = getSupportedMP4AudioCodecs(context, videoTestElement);
  const mp4VideoCodecs = getSupportedMP4VideoCodecs(context, videoTestElement);
  const canPlayHls =
    canPlayNativeHls(context, videoTestElement) || canPlayHlsWithMSE(context);

  if (canPlayHls) {
    TranscodingProfiles.push({
      // hlsjs, edge, and android all seem to require ts container
      Container:
        !canPlayNativeHls(context, videoTestElement) ||
        (context.$browser.isEdge() && !context.$browser.isChromiumBased()) ||
        context.$browser.isAndroid()
          ? 'ts'
          : 'aac',
      Type: DlnaProfileType.Audio,
      AudioCodec: 'aac',
      Context: EncodingContext.Streaming,
      Protocol: 'hls',
      MaxAudioChannels: physicalAudioChannels.toString(),
      MinSegments: context.$browser.isApple() ? 2 : 1,
      BreakOnNonKeyFrames: hlsBreakOnNonKeyFrames
    });
  }

  ['aac', 'mp3', 'opus', 'wav']
    .filter((format) => getSupportedAudioCodecs(context, format))
    .forEach((audioFormat) => {
      TranscodingProfiles.push({
        Container: audioFormat,
        Type: DlnaProfileType.Audio,
        AudioCodec: audioFormat,
        Context: EncodingContext.Streaming,
        Protocol: 'http',
        MaxAudioChannels: physicalAudioChannels.toString()
      });
    });

  const hlsInFmp4VideoCodecs = getSupportedFmp4VideoCodecs(
    context,
    videoTestElement
  );
  const hlsInFmp4AudioCodecs = getSupportedFmp4AudioCodecs(
    context,
    videoTestElement
  );

  console.dir(hlsInFmp4VideoCodecs);
  console.dir(hlsInFmp4AudioCodecs);

  const hlsInTsVideoCodecs = getSupportedTsVideoCodecs(videoTestElement);
  const hlsInTsAudioCodecs = getSupportedTsAudioCodecs(
    context,
    videoTestElement
  );

  if (canPlayHls) {
    if (hlsInFmp4VideoCodecs.length && hlsInFmp4AudioCodecs.length) {
      TranscodingProfiles.push({
        Container: 'mp4',
        Type: DlnaProfileType.Video,
        AudioCodec: hlsInFmp4AudioCodecs.join(','),
        VideoCodec: hlsInFmp4VideoCodecs.join(','),
        Context: EncodingContext.Streaming,
        Protocol: 'hls',
        MaxAudioChannels: physicalAudioChannels.toString(),
        MinSegments: context.$browser.isApple() ? 2 : 1,
        BreakOnNonKeyFrames: hlsBreakOnNonKeyFrames
      });
    }

    if (hlsInTsVideoCodecs.length && hlsInTsAudioCodecs.length) {
      TranscodingProfiles.push({
        Container: 'ts',
        Type: DlnaProfileType.Video,
        AudioCodec: hlsInTsAudioCodecs.join(','),
        VideoCodec: hlsInTsVideoCodecs.join(','),
        Context: EncodingContext.Streaming,
        Protocol: 'hls',
        MaxAudioChannels: physicalAudioChannels.toString(),
        MinSegments: context.$browser.isApple() ? 2 : 1,
        BreakOnNonKeyFrames: hlsBreakOnNonKeyFrames
      });
    }
  }

  if (hasMkvSupport(context, videoTestElement) && !context.$browser.isTizen()) {
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
