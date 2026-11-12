/**
 * Builders for the specs: media sources and streams with the exact vocabulary the server uses
 * (values taken from real `PlaybackInfo` answers of Jellyfin 12.4 for the e2e test files), and probed tracks with
 * the vocabulary mediabunny uses.
 */
import type { MediaSourceInfo, MediaStream } from '@jellyfin/sdk/lib/generated-client';
import type { ProbedAudioTrack, ProbedVideoTrack, ProbeResult } from '#/utils/playback-capabilities/probe.ts';

/**
 * A video stream, H.264 640x360 at 25 fps by default
 */
export function videoStream(extra: Partial<MediaStream> = {}): MediaStream {
  return {
    Type: 'Video',
    Index: 0,
    Codec: 'h264',
    CodecTag: 'avc1',
    Profile: 'High',
    Width: 640,
    Height: 360,
    BitRate: 793_179,
    RealFrameRate: 25,
    AverageFrameRate: 25,
    BitDepth: 8,
    VideoRange: 'SDR',
    VideoRangeType: 'SDR',
    IsExternal: false,
    ...extra
  };
}

/**
 * An audio stream, AAC stereo 48 kHz by default
 */
export function audioStream(extra: Partial<MediaStream> = {}): MediaStream {
  return {
    Type: 'Audio',
    Index: 1,
    Codec: 'aac',
    CodecTag: 'mp4a',
    Profile: 'LC',
    Channels: 2,
    SampleRate: 48_000,
    BitRate: 128_053,
    IsExternal: false,
    IsDefault: true,
    ...extra
  };
}

/**
 * A subtitle stream
 */
export function subtitleStream(codec: string, isText: boolean, extra: Partial<MediaStream> = {}): MediaStream {
  return {
    Type: 'Subtitle',
    Index: 2,
    Codec: codec,
    IsTextSubtitleStream: isText,
    SupportsExternalStream: true,
    IsExternal: false,
    ...extra
  };
}

/**
 * A media source. By default an MP4 with the given streams
 */
export function mediaSource(streams: MediaStream[], extra: Partial<MediaSourceInfo> = {}): MediaSourceInfo {
  const firstAudio = streams.find(stream => stream.Type === 'Audio');

  return {
    Id: 'source-id',
    Protocol: 'File',
    Container: 'mp4',
    Bitrate: 928_692,
    ETag: 'etag',
    IsRemote: false,
    SupportsDirectPlay: true,
    SupportsDirectStream: true,
    SupportsTranscoding: true,
    MediaStreams: streams,
    DefaultAudioStreamIndex: firstAudio?.Index,
    ...extra
  };
}

/**
 * A probed video track, H.264 in MP4 by default
 */
export function probedVideo(extra: Partial<ProbedVideoTrack> = {}): ProbedVideoTrack {
  return {
    type: 'video',
    codec: 'avc',
    codecString: 'avc1.64001e',
    internalCodecId: 'avc1',
    language: 'und',
    isDefault: true,
    isForced: false,
    width: 640,
    height: 360,
    colorSpace: { primaries: 'bt709', transfer: 'bt709', matrix: 'bt709', fullRange: false },
    hdr: false,
    ...extra
  };
}

/**
 * A probed audio track, AAC-LC in MP4 by default
 */
export function probedAudio(extra: Partial<ProbedAudioTrack> = {}): ProbedAudioTrack {
  return {
    type: 'audio',
    codec: 'aac',
    codecString: 'mp4a.40.2',
    internalCodecId: 'mp4a',
    language: 'und',
    isDefault: true,
    isForced: false,
    channels: 2,
    sampleRate: 48_000,
    pcm: false,
    ...extra
  };
}

/**
 * A successful probe result
 */
export function probeOk(
  containerMime: string,
  video: ProbedVideoTrack[],
  audio: ProbedAudioTrack[]
): ProbeResult {
  return {
    status: 'ok',
    cacheable: true,
    containerMime,
    video,
    audio,
    stats: { requests: 1, bytes: 1000, durationMs: 10 }
  };
}
