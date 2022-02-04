import { DirectPlayProfile, DlnaProfileType } from '@jellyfin/client-axios';
import { Context } from '@nuxt/types';
import { getSupportedMP4VideoCodecs } from './helpers/mp4VideoFormats';
import { getSupportedMP4AudioCodecs } from './helpers/mp4AudioFormats';
import { hasMkvSupport } from './helpers/transcodingFormats';
import { getSupportedWebMAudioCodecs } from './helpers/webmAudioFormats';
import { getSupportedWebMVideoCodecs } from './helpers/webmVideoFormats';
import { getSupportedAudioCodecs } from './helpers/audioFormats';

/**
 * Returns a valid DirectPlayProfile for the current platform.
 *
 * @param {Context} context - Nuxt context
 * @param {HTMLVideoElement} videoTestElement - A HTML video element for testing codecs
 * @returns {Array<DirectPlayProfile>} An array of direct play profiles for the current platform.
 */
export function getDirectPlayProfiles(
  context: Context,
  videoTestElement: HTMLVideoElement
): Array<DirectPlayProfile> {
  const DirectPlayProfiles: DirectPlayProfile[] = [];

  const webmVideoCodecs = getSupportedWebMVideoCodecs(
    context,
    videoTestElement
  );
  const webmAudioCodecs = getSupportedWebMAudioCodecs(
    context,
    videoTestElement
  );

  const mp4VideoCodecs = getSupportedMP4VideoCodecs(context, videoTestElement);
  const mp4AudioCodecs = getSupportedMP4AudioCodecs(context, videoTestElement);

  if (webmVideoCodecs.length) {
    DirectPlayProfiles.push({
      Container: 'webm',
      Type: DlnaProfileType.Video,
      VideoCodec: webmVideoCodecs.join(','),
      AudioCodec: webmAudioCodecs.join(',')
    });
  }

  if (mp4VideoCodecs.length) {
    DirectPlayProfiles.push({
      Container: 'mp4,m4v',
      Type: DlnaProfileType.Video,
      VideoCodec: mp4VideoCodecs.join(','),
      AudioCodec: mp4AudioCodecs.join(',')
    });
  }

  if (hasMkvSupport(context, videoTestElement) && mp4VideoCodecs.length) {
    DirectPlayProfiles.push({
      Container: 'mkv',
      Type: DlnaProfileType.Video,
      VideoCodec: mp4VideoCodecs.join(','),
      AudioCodec: mp4AudioCodecs.join(',')
    });
  }

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

  for (const audioFormat of supportedAudio.filter((format) =>
    getSupportedAudioCodecs(context, format)
  )) {
    DirectPlayProfiles.push({
      Container: audioFormat,
      Type: DlnaProfileType.Audio
    });

    if (audioFormat === 'opus' || audioFormat === 'webma') {
      DirectPlayProfiles.push({
        Container: 'webm',
        Type: DlnaProfileType.Audio,
        AudioCodec: audioFormat
      });
    }

    // aac also appears in the m4a and m4b container
    if (audioFormat === 'aac' || audioFormat === 'alac') {
      DirectPlayProfiles.push({
        Container: 'm4a',
        AudioCodec: audioFormat,
        Type: DlnaProfileType.Audio
      });

      DirectPlayProfiles.push({
        Container: 'm4b',
        AudioCodec: audioFormat,
        Type: DlnaProfileType.Audio
      });
    }
  }

  return DirectPlayProfiles;
}
