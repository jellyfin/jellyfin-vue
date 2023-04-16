import {
  MediaSourceInfo,
  MediaStream
} from '@jellyfin/sdk/lib/generated-client';
import { isBoolean, isNil } from 'lodash-es';
import { formatFileSize } from './items';
import { usei18n } from '@/composables';

const { t } = usei18n();
const profileTranslation = t('mediaInfoGenericProfile');

type MediaItem = string | number | boolean;
type NoneType = null | undefined;

/**
 * Format a boolean value into a Yes/No string.
 * @param value - The boolean value to format.
 */
export function formatYesOrNo(value: boolean | NoneType): string {
  return value ? 'Yes' : 'No';
}

/**
 * Check if a value is a valid media item.
 */
function checkValidValue(value: MediaItem | NoneType): value is MediaItem {
  if (isNil(value)) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return true;
}

/**
 * Format a media attribute into a mediainfo text format.
 * @param key - The key of the attribute.
 * @param value - The value of the attribute.
 * @param suffix - An optional suffix to append to the attribute.
 */
function formatMediaAttr(
  key: string,
  value: MediaItem | NoneType,
  suffix?: string
): string {
  return checkValidValue(value)
    ? `${key} ${value} ${suffix ?? ''}`.trimEnd() + '\n'
    : '';
}

/**
 * Create generic information about the media stream.
 * @param stream - The media stream to create information for.
 */
function createGenericInfo(stream: MediaStream): string {
  let mediaInfo = '';

  mediaInfo += formatMediaAttr(t('mediaInfoFileTitle'), stream.DisplayTitle);
  mediaInfo += formatMediaAttr(t('mediaInfoGenericLanguage'), stream.Language);
  mediaInfo += formatMediaAttr(
    t('mediaInfoGenericCodec'),
    stream.Codec?.toUpperCase()
  );
  mediaInfo += formatMediaAttr(t('mediaInfoGenericCodecTag'), stream.CodecTag);

  return mediaInfo;
}

/**
 * Create generic information about the Default/Forced/External status of a stream.
 * @param stream - The media stream to create information for.
 */
function createExtraInformation(stream: MediaStream): string {
  let mediaInfo = '';

  mediaInfo += formatMediaAttr(
    t('mediaInfoGenericIsDefault'),
    formatYesOrNo(stream.IsDefault)
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfoGenericIsForced'),
    formatYesOrNo(stream.IsForced)
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfoGenericIsExternal'),
    formatYesOrNo(stream.IsExternal)
  );

  return mediaInfo;
}

/**
 * Create information about Dolby Vision if exist.
 * @param stream - The media stream to create information for.
 */
function createVideoDoViInformation(stream: MediaStream): string {
  let mediaInfo = '';

  if (typeof stream.VideoDoViTitle !== 'string') {
    return mediaInfo;
  }

  mediaInfo += formatMediaAttr(
    t('mediaInfoVideoDoViTitle'),
    stream.VideoDoViTitle
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfoVideoDoViMajorVersion'),
    stream.DvVersionMajor
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfoVideoDoViMinorVersion'),
    stream.DvVersionMinor
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfoVideoDoViProfile'),
    stream.DvProfile
  );
  mediaInfo += formatMediaAttr(t('mediaInfoVideoDoViLevel'), stream.DvLevel);
  mediaInfo += formatMediaAttr(
    t('mediaInfoVideoDoViRpuPresent'),
    stream.RpuPresentFlag
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfoVideoDoViElPresent'),
    stream.ElPresentFlag
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfoVideoDoViBlPresent'),
    stream.BlPresentFlag
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfoVideoDoViBlSignalCompatId'),
    stream.DvBlSignalCompatibilityId
  );

  return mediaInfo;
}

/**
 * Create information about the color space used in the video stream.
 * @param stream - The media stream to create information for.
 */
function createVideoColorInformation(stream: MediaStream): string {
  let mediaInfo = '';

  mediaInfo += formatMediaAttr(
    t('mediaInfoVideoColorSpace'),
    stream.ColorSpace
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfoVideoColorTransfer'),
    stream.ColorTransfer
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfoVideoColorPrimaries'),
    stream.ColorPrimaries
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfoVideoColorRange'),
    stream.ColorRange
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfoVideoPixelFormat'),
    stream.PixelFormat
  );

  return mediaInfo;
}

/**
 * Format video media info into a mediainfo text format
 * @param stream - The media stream to create information for.
 */
export function createVideoInformation(stream: MediaStream): string {
  let mediaInfo = createGenericInfo(stream);

  mediaInfo += formatMediaAttr(
    t('mediaInfoVideoIsAvc'),
    formatYesOrNo(stream.IsAVC)
  );
  mediaInfo += formatMediaAttr(profileTranslation, stream.Profile);
  mediaInfo += formatMediaAttr(t('mediaInfoVideoLevel'), stream.Level);

  if (stream.Width || stream.Height) {
    mediaInfo += formatMediaAttr(
      t('mediaInfoVideoResolution'),
      `${stream.Width}x${stream.Height}`
    );
  }

  if (stream.AspectRatio) {
    mediaInfo += formatMediaAttr(
      t('mediaInfoVideoAspectRatio'),
      stream.AspectRatio
    );
  }

  // Do not show if flag does not exist
  mediaInfo += formatMediaAttr(
    t('mediaInfoVideoIsAnamorphic'),
    isBoolean(stream.IsAnamorphic)
      ? formatYesOrNo(stream.IsAnamorphic)
      : undefined
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfoVideoIsInterlaced'),
    formatYesOrNo(stream.IsInterlaced)
  );

  if (stream.AverageFrameRate || stream.RealFrameRate) {
    mediaInfo += formatMediaAttr(
      t('mediaInfoVideoFrameRate'),
      (stream.AverageFrameRate || stream.RealFrameRate)?.toFixed(3),
      'fps'
    );
  }

  mediaInfo += formatMediaAttr(
    t('mediaInfoGenericBitrate'),
    stream.BitRate ? (stream.BitRate / 1000).toFixed(2) : '',
    'kbps'
  );

  mediaInfo += formatMediaAttr(
    t('mediaInfoVideoBitDepth'),
    stream.BitDepth,
    'bits'
  );

  mediaInfo += formatMediaAttr(t('mediaInfoVideoRange'), stream.VideoRange);
  mediaInfo += formatMediaAttr(
    t('mediaInfoVideoRangeType'),
    stream.VideoRangeType
  );

  mediaInfo += createVideoDoViInformation(stream);
  mediaInfo += createVideoColorInformation(stream);
  mediaInfo += formatMediaAttr('NAL', stream.NalLengthSize);

  return mediaInfo;
}

/**
 * Format audio media info into a mediainfo text format
 * @param stream - The media stream to create information for.
 */
export function createAudioInformation(stream: MediaStream): string {
  let mediaInfo = createGenericInfo(stream);

  mediaInfo += formatMediaAttr(profileTranslation, stream.Profile);
  mediaInfo += formatMediaAttr(
    t('mediaInfoAudioChannelLayout'),
    stream.ChannelLayout
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfoAudioChannels'),
    stream.Channels,
    'ch'
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfoGenericBitrate'),
    stream.BitRate ? (stream.BitRate / 1000).toFixed(2) : '',
    'kbps'
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfoAudioSampleRate'),
    stream.SampleRate,
    'Hz'
  );

  mediaInfo += createExtraInformation(stream);

  return mediaInfo;
}

/**
 * Format subtitle media info into a mediainfo text format
 * @param stream - The media stream to create information for.
 */
export function createSubsInformation(stream: MediaStream): string {
  let mediaInfo = createGenericInfo(stream);

  mediaInfo += createExtraInformation(stream);

  return mediaInfo;
}

/**
 * Format embbedded media info into a mediainfo text format
 * @param stream - The media stream to create information for.
 */
export function createEmbeddedInformation(stream: MediaStream): string {
  let mediaInfo = createGenericInfo(stream);

  mediaInfo += formatMediaAttr(profileTranslation, stream.Profile);

  if (stream.Width || stream.Height) {
    mediaInfo += formatMediaAttr(
      t('mediaInfoVideoResolution'),
      `${stream.Width}x${stream.Height}`
    );
  }

  mediaInfo += formatMediaAttr(
    t('mediaInfoVideoBitDepth'),
    stream.BitDepth,
    'bits'
  );
  mediaInfo += createVideoColorInformation(stream);
  mediaInfo += formatMediaAttr(t('mediaInfoVideoRefFrames'), stream.RefFrames);

  return mediaInfo;
}

/**
 * Format container media info into a mediainfo text format
 * @param media - The media source to create information for.
 */
export function createContainerInformation(media: MediaSourceInfo): string {
  let mediaInfo = '';

  mediaInfo += formatMediaAttr(t('mediaInfoFileContainer'), media.Container);
  mediaInfo += formatMediaAttr(t('mediaInfoFilePath'), media.Path);
  mediaInfo += formatMediaAttr(
    t('mediaInfoFileSize'),
    media.Size ? formatFileSize(media.Size) : ''
  );

  return mediaInfo;
}
