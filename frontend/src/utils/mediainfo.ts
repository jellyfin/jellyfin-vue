import {
  MediaSourceInfo,
  MediaStream
} from '@jellyfin/sdk/lib/generated-client';
import { isNil } from 'lodash-es';
import { formatFileSize } from './items';
import { usei18n } from '@/composables';

const { t } = usei18n();

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

  mediaInfo += formatMediaAttr(
    t('mediaInfo.generic.title'),
    stream.DisplayTitle
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfo.generic.language'),
    stream.Language
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfo.generic.codec'),
    stream.Codec?.toUpperCase()
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfo.generic.codecTag'),
    stream.CodecTag
  );

  return mediaInfo;
}

/**
 * Create generic information about the Default/Forced/External status of a stream.
 * @param stream - The media stream to create information for.
 */
function createExtraInformation(stream: MediaStream): string {
  let mediaInfo = '';

  mediaInfo += formatMediaAttr(
    t('mediaInfo.generic.default'),
    formatYesOrNo(stream.IsDefault)
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfo.generic.forced'),
    formatYesOrNo(stream.IsForced)
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfo.generic.external'),
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
    t('mediaInfo.videoCodec.DoVi.title'),
    stream.VideoDoViTitle
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfo.videoCodec.DoVi.majorVersion'),
    stream.DvVersionMajor
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfo.videoCodec.DoVi.minorVersion'),
    stream.DvVersionMinor
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfo.videoCodec.DoVi.profile'),
    stream.DvProfile
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfo.videoCodec.DoVi.level'),
    stream.DvLevel
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfo.videoCodec.DoVi.rpuPresent'),
    stream.RpuPresentFlag
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfo.videoCodec.DoVi.elPresent'),
    stream.ElPresentFlag
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfo.videoCodec.DoVi.blPresent'),
    stream.BlPresentFlag
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfo.videoCodec.DoVi.blSignalCompatibilityId'),
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
    t('mediaInfo.videoCodec.colorSpace'),
    stream.ColorSpace
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfo.videoCodec.colorTransfer'),
    stream.ColorTransfer
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfo.videoCodec.colorPrimaries'),
    stream.ColorPrimaries
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfo.videoCodec.colorRange'),
    stream.ColorRange
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfo.videoCodec.pixelFormat'),
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
    t('mediaInfo.videoCodec.isAvc'),
    formatYesOrNo(stream.IsAVC)
  );
  mediaInfo += formatMediaAttr(t('mediaInfo.generic.profile'), stream.Profile);
  mediaInfo += formatMediaAttr(t('mediaInfo.videoCodec.level'), stream.Level);

  if (stream.Width || stream.Height) {
    mediaInfo += formatMediaAttr(
      t('mediaInfo.videoCodec.resolution'),
      `${stream.Width}x${stream.Height}`
    );
  }

  if (stream.AspectRatio && stream.Codec !== 'mjpeg') {
    mediaInfo += formatMediaAttr(
      t('mediaInfo.videoCodec.aspectRatio'),
      stream.AspectRatio
    );
  }

  mediaInfo += formatMediaAttr(
    t('mediaInfo.videoCodec.isInterlaced'),
    formatYesOrNo(stream.IsInterlaced)
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfo.videoCodec.isAnamorphic'),
    formatYesOrNo(stream.IsAnamorphic)
  );

  if (stream.AverageFrameRate || stream.RealFrameRate) {
    mediaInfo += formatMediaAttr(
      t('mediaInfo.videoCodec.frameRate'),
      (stream.AverageFrameRate || stream.RealFrameRate)?.toFixed(3),
      'fps'
    );
  }

  mediaInfo += formatMediaAttr(
    t('mediaInfo.generic.bitrate'),
    stream.BitRate ? (stream.BitRate / 1000).toFixed(2) : '',
    'kbps'
  );

  mediaInfo += formatMediaAttr(
    t('mediaInfo.videoCodec.bitdepth'),
    stream.BitDepth,
    'bits'
  );

  mediaInfo += formatMediaAttr(
    t('mediaInfo.videoCodec.videoRange'),
    stream.VideoRange
  );
  mediaInfo += formatMediaAttr(
    t('mediaInfo.videoCodec.videoRangeType'),
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

  if (stream.Profile) {
    mediaInfo += t('mediaInfo.generic.profile') + ' ' + stream.Profile + '\n';
  }

  if (stream.ChannelLayout) {
    mediaInfo +=
      t('mediaInfo.audioCodec.layout') + ' ' + stream.ChannelLayout + '\n';
  }

  if (stream.Channels) {
    mediaInfo +=
      t('mediaInfo.audioCodec.channels') + ` ${stream.Channels} ch\n`;
  }

  if (stream.BitRate) {
    mediaInfo +=
      t('mediaInfo.generic.bitrate') +
      ` ${(stream.BitRate / 1000).toFixed(2)} kbps\n`;
  }

  if (stream.SampleRate) {
    mediaInfo +=
      t('mediaInfo.audioCodec.sampleRate') + ` ${stream.SampleRate} Hz\n`;
  }

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
 * Format container media info into a mediainfo text format
 * @param media - The media source to create information for.
 */
export function createContainerInformation(media: MediaSourceInfo): string {
  let mediaInfo = '';

  if (media.Name) {
    mediaInfo += `${media.Name}\n`;
  }

  mediaInfo += formatMediaAttr(
    t('mediaInfo.generic.container'),
    media.Container
  );
  mediaInfo += formatMediaAttr(t('mediaInfo.generic.path'), media.Path);
  mediaInfo += formatMediaAttr(
    t('mediaInfo.generic.size'),
    media.Size ? formatFileSize(media.Size) : ''
  );

  return mediaInfo;
}
