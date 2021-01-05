import { DirectPlayProfile, DlnaProfileType } from '@jellyfin/client-axios';
import { getSupportedMP4VideoCodecs } from './helpers/mp4VideoFormats';
import { hasMkvSupport } from './helpers/transcodingFormats';
import { getSupportedWebMAudioCodecs } from './helpers/webmAudioFormats';

/**
 * Returns a valid DirectPlayProfile for the current platform.
 *
 * @param {HTMLVideoElement} videoTestElement - A HTML video element for testing codecs
 * @returns {Array<DirectPlayProfile>} An array of direct play profiles for the current platform.
 */
export function getDirectPlayProfiles(
  videoTestElement: HTMLVideoElement
): Array<DirectPlayProfile> {
  const DirectPlayProfiles = [] as DirectPlayProfile[];

  const webmVideoCodecs = getSupportedMP4VideoCodecs(videoTestElement);
  const webmAudioCodecs = getSupportedWebMAudioCodecs(videoTestElement);

  const mp4VideoCodecs = getSupportedMP4VideoCodecs(videoTestElement);
  const mp4AudioCodecs = getSupportedWebMAudioCodecs(videoTestElement);

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

  if (hasMkvSupport(videoTestElement) && mp4VideoCodecs.length) {
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
