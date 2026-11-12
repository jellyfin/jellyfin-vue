import { describe, expect, test } from 'vitest';
import type { MediaSourceInfo, MediaStream } from '@jellyfin/sdk/lib/generated-client';
import { audioStream, mediaSource, probedAudio, probedVideo, videoStream } from './fixtures.ts';
import {
  getAudioTargetCandidate,
  getHdrFields,
  getStreamCandidates,
  getVideoTargetCandidate,
  type DecodingMode,
  type HdrFields
} from '#/utils/playback-capabilities/media-config.ts';
import type { ProbedTrack } from '#/utils/playback-capabilities/probe.ts';
import { FALLBACK_BITRATE, FALLBACK_FRAME_RATE } from '#/utils/playback-capabilities/constants.ts';

interface CandidateOptions {
  probed?: ProbedTrack;
  containerMime?: string;
  mode?: DecodingMode;
  source?: Partial<MediaSourceInfo>;
}

/**
 * Candidates of one stream of a source
 */
function candidates(stream: MediaStream, options: CandidateOptions = {}): MediaDecodingConfiguration[] {
  return getStreamCandidates({
    source: mediaSource([stream], options.source),
    stream,
    probed: options.probed,
    containerMime: options.containerMime,
    mode: options.mode ?? 'file'
  });
}

/**
 * The candidates' content types, which is what most rules are about
 */
function contentTypes(stream: MediaStream, options: CandidateOptions = {}): (string | undefined)[] {
  return candidates(stream, options).map(config => config.video?.contentType ?? config.audio?.contentType);
}

/**
 * The members of the first candidate (video or audio)
 */
function firstMembers(stream: MediaStream, options: CandidateOptions = {}): VideoConfiguration | AudioConfiguration | undefined {
  const [config] = candidates(stream, options);

  return config?.video ?? config?.audio;
}

const hevc = videoStream({ Codec: 'hevc', CodecTag: 'hvc1', Profile: 'Main 10', BitDepth: 10 });
const pcm = audioStream({ Codec: 'pcm_s16le', CodecTag: undefined, Channels: 2 });
const dovi = (extra: Partial<MediaStream>) => videoStream({
  Codec: 'hevc',
  VideoRange: 'HDR',
  VideoRangeType: 'DOVI',
  DvProfile: 5,
  DvLevel: 6,
  BitDepth: 10,
  ...extra
});

/**
 * A probed HEVC track: mediabunny always writes the hev1 prefix
 */
function probedHevc(internalCodecId: string): ProbedTrack {
  return probedVideo({ codec: 'hevc', codecString: 'hev1.2.4.L93.B0', internalCodecId });
}

/**
 * A probed PCM track: mediabunny writes WebCodecs names for PCM
 */
function probedPcm(internalCodecId: string | number): ProbedTrack {
  return probedAudio({ codec: 'pcm-s16', codecString: 'pcm-s16', internalCodecId, pcm: true });
}

describe('every candidate asks about exactly one codec of one stream', () => {
  const cases: [string, MediaDecodingConfiguration[]][] = [
    ['exact video', candidates(videoStream(), { probed: probedVideo(), containerMime: 'video/mp4' })],
    ['generic video', candidates(videoStream({ Codec: 'mpeg4', CodecTag: 'XVID' }), { source: { Container: 'avi' } })],
    ['exact audio', candidates(audioStream(), { probed: probedAudio(), containerMime: 'video/mp4' })],
    ['generic audio', candidates(audioStream({ Codec: 'dts', CodecTag: undefined }), { source: { Container: 'mkv' } })],
    ['Matroska HEVC (two prefixes)', candidates(hevc, { probed: probedHevc('V_MPEGH/ISO/HEVC'), containerMime: 'video/x-matroska' })]
  ];

  test.each(cases)('%s: one codec per query, never video and audio together', (_, configs) => {
    const violations = configs.filter((config) => {
      const codecs = /codecs="([^"]*)"/.exec(config.video?.contentType ?? config.audio?.contentType ?? '')?.[1];

      return Boolean(config.video) === Boolean(config.audio) || !codecs || codecs.includes(',');
    });

    expect(configs.length).toBeGreaterThan(0);
    expect(violations).toEqual([]);
  });
});

describe('real values from the stream, with fallbacks', () => {
  const cases: [string, MediaStream, CandidateOptions, Partial<VideoConfiguration & AudioConfiguration> | undefined][] = [
    [
      'video carries the stream\'s size, bitrate and real frame rate',
      videoStream({ Width: 1920, Height: 1080, BitRate: 5_000_000, RealFrameRate: 30, AverageFrameRate: 24 }),
      { probed: probedVideo(), containerMime: 'video/mp4' },
      { width: 1920, height: 1080, bitrate: 5_000_000, framerate: 30 }
    ],
    [
      'frame rate falls back to the average frame rate',
      videoStream({ RealFrameRate: undefined, AverageFrameRate: 50 }),
      {},
      { framerate: 50 }
    ],
    [
      'frame rate falls back to the documented constant when the server has none',
      videoStream({ RealFrameRate: undefined, AverageFrameRate: undefined }),
      {},
      { framerate: FALLBACK_FRAME_RATE }
    ],
    [
      'video bitrate falls back to the source bitrate',
      videoStream({ BitRate: undefined }),
      { source: { Bitrate: 3_000_000 } },
      { bitrate: 3_000_000 }
    ],
    [
      'video bitrate falls back to the documented constant when nobody knows it',
      videoStream({ BitRate: undefined }),
      { source: { Bitrate: undefined } },
      { bitrate: FALLBACK_BITRATE }
    ],
    [
      'size falls back to the probed size when the server has none',
      videoStream({ Width: undefined, Height: undefined }),
      { probed: probedVideo({ width: 1280, height: 720 }), containerMime: 'video/mp4' },
      { width: 1280, height: 720 }
    ],
    [
      'audio carries the channel count as a string, the sample rate and the stream bitrate',
      audioStream({ Channels: 6, SampleRate: 44_100, BitRate: 384_000 }),
      { probed: probedAudio(), containerMime: 'video/mp4' },
      { channels: '6', samplerate: 44_100, bitrate: 384_000 }
    ]
  ];

  test.each(cases)('%s', (_, stream, options, expected) => {
    const members = firstMembers(stream, options);

    expect(members).toMatchObject(expected ?? {});
  });

  const unknownAsZero: [string, MediaStream, CandidateOptions, Partial<VideoConfiguration & AudioConfiguration>][] = [
    [
      'a real frame rate of 0 is unknown: the average frame rate is used',
      videoStream({ RealFrameRate: 0, AverageFrameRate: 50 }),
      {},
      { framerate: 50 }
    ],
    [
      'frame rates of 0 are unknown: the documented constant is used (decodingInfo rejects a frame rate of 0)',
      videoStream({ RealFrameRate: 0, AverageFrameRate: 0 }),
      {},
      { framerate: FALLBACK_FRAME_RATE }
    ],
    [
      'a video bitrate of 0 is unknown: the source bitrate is used',
      videoStream({ BitRate: 0 }),
      { source: { Bitrate: 3_000_000 } },
      { bitrate: 3_000_000 }
    ],
    [
      'bitrates of 0 are unknown: the documented constant is used',
      videoStream({ BitRate: 0 }),
      { source: { Bitrate: 0 } },
      { bitrate: FALLBACK_BITRATE }
    ],
    [
      'a size of 0 is unknown: the probed size is used',
      videoStream({ Width: 0, Height: 0 }),
      { probed: probedVideo({ width: 1280, height: 720 }), containerMime: 'video/mp4' },
      { width: 1280, height: 720 }
    ],
    [
      'channels and a sample rate of 0 are unknown: the probed ones are used',
      audioStream({ Channels: 0, SampleRate: 0 }),
      { probed: probedAudio({ channels: 6, sampleRate: 44_100 }), containerMime: 'video/mp4' },
      { channels: '6', samplerate: 44_100 }
    ]
  ];

  test.each(unknownAsZero)('%s', (_, stream, options, expected) => {
    const members = firstMembers(stream, options);

    expect(members).toMatchObject(expected);
  });

  test('negative values are unknown too, and an audio member nobody knows is left out', () => {
    const members = firstMembers(audioStream({ Channels: -1, SampleRate: -1, BitRate: -1 }));

    expect(members).not.toHaveProperty('channels');
    expect(members).not.toHaveProperty('samplerate');
    expect(members).not.toHaveProperty('bitrate');
  });

  test('audio never borrows the bitrate of the whole source (it is optional for audio)', () => {
    const members = firstMembers(audioStream({ BitRate: undefined }), { source: { Bitrate: 30_000_000 } });

    expect(members).not.toHaveProperty('bitrate');
  });

  test('a video whose size nobody knows cannot be asked about: no candidates', () => {
    const result = candidates(videoStream({ Width: undefined, Height: undefined }));

    expect(result).toEqual([]);
  });

  test('direct play questions are of type file', () => {
    const types = candidates(videoStream(), { probed: probedVideo(), containerMime: 'video/mp4' }).map(config => config.type);

    expect(types).toEqual(['file']);
  });
});

const contentTypeCases: [string, string, MediaStream, CandidateOptions, string[]][] = [
  // Exact candidate
  ['exact', 'H.264 in MP4: probed container MIME and probed codec string', videoStream(), { probed: probedVideo(), containerMime: 'video/mp4' }, ['video/mp4; codecs="avc1.64001e"']],
  ['exact', 'the audio of a video file uses the audio top-level type of the same container', audioStream(), { probed: probedAudio(), containerMime: 'video/mp4' }, ['audio/mp4; codecs="mp4a.40.2"']],
  ['exact', 'the audio of a Matroska file too', audioStream({ Codec: 'opus' }), { probed: probedAudio({ codec: 'opus', codecString: 'opus', internalCodecId: 'A_OPUS' }), containerMime: 'video/x-matroska' }, ['audio/x-matroska; codecs="opus"']],
  ['exact', 'an audio-only file keeps its own MIME type', audioStream({ Codec: 'mp3' }), { probed: probedAudio({ codec: 'mp3', codecString: 'mp3', internalCodecId: undefined }), containerMime: 'audio/mpeg' }, ['audio/mpeg; codecs="mp3"']],

  // HEVC prefix
  ['HEVC', 'an hvc1 sample entry is asked as hvc1 (mediabunny wrote hev1)', hevc, { probed: probedHevc('hvc1'), containerMime: 'video/mp4' }, ['video/mp4; codecs="hvc1.2.4.L93.B0"']],
  ['HEVC', 'an hev1 sample entry is asked as hev1', hevc, { probed: probedHevc('hev1'), containerMime: 'video/mp4' }, ['video/mp4; codecs="hev1.2.4.L93.B0"']],
  ['HEVC', 'a container without fourcc (Matroska) gets both prefixes as two candidates', hevc, { probed: probedHevc('V_MPEGH/ISO/HEVC'), containerMime: 'video/x-matroska' }, ['video/x-matroska; codecs="hvc1.2.4.L93.B0"', 'video/x-matroska; codecs="hev1.2.4.L93.B0"']],
  ['HEVC', 'through media-source the server writes the container, so both prefixes are asked (the file\'s first)', hevc, { probed: probedHevc('hev1'), containerMime: 'video/mp4', mode: 'media-source' }, ['video/mp4; codecs="hev1.2.4.L93.B0"', 'video/mp4; codecs="hvc1.2.4.L93.B0"']],

  // PCM
  ['PCM', 'PCM in WAVE is asked with the format tag, the codecs value RFC 2361 defines for WAVE', pcm, { probed: probedPcm(1), containerMime: 'audio/wav', source: { Container: 'wav' } }, ['audio/wav; codecs="1"']],
  ['PCM', 'PCM in MP4 is asked with its sample entry fourcc', pcm, { probed: probedPcm('ipcm'), containerMime: 'video/mp4' }, ['audio/mp4; codecs="ipcm"']],
  ['PCM', 'PCM in Matroska has no MIME codecs value, so it falls to the generic candidate', pcm, { probed: probedPcm('A_PCM/INT/LIT'), containerMime: 'video/x-matroska', source: { Container: 'mkv' } }, ['audio/x-matroska; codecs="pcm_s16le"']],

  // QuickTime
  ['QuickTime', 'a .mov file gets a video/quicktime and a video/mp4 candidate', videoStream(), { probed: probedVideo(), containerMime: 'video/quicktime' }, ['video/quicktime; codecs="avc1.64001e"', 'video/mp4; codecs="avc1.64001e"']],
  ['QuickTime', 'its audio too', audioStream(), { probed: probedAudio(), containerMime: 'video/quicktime' }, ['audio/quicktime; codecs="mp4a.40.2"', 'audio/mp4; codecs="mp4a.40.2"']],

  // Generic
  ['generic', 'without probe: the server\'s container token, with the codec tag and then the codec name (AVI)', videoStream({ Codec: 'mpeg4', CodecTag: 'XVID' }), { source: { Container: 'avi' } }, ['video/avi; codecs="XVID"', 'video/avi; codecs="mpeg4"']],
  ['generic', 'every comma-separated container token is a candidate', videoStream({ Codec: 'h264', CodecTag: undefined }), { source: { Container: 'mov,mp4,m4a' } }, ['video/mov; codecs="h264"', 'video/mp4; codecs="h264"', 'video/m4a; codecs="h264"']],
  ['generic', 'a codec tag equal to the codec name is not asked twice', audioStream({ Codec: 'alac', CodecTag: 'alac' }), { source: { Container: 'm4a' } }, ['audio/m4a; codecs="alac"']],
  ['generic', 'when mediabunny does not know the codec, the probed container is used with the server\'s names', videoStream({ Codec: 'mpeg4', CodecTag: 'mp4v' }), { probed: probedVideo({ codec: undefined, codecString: undefined, internalCodecId: 'mp4v' }), containerMime: 'video/mp4' }, ['video/mp4; codecs="mp4v"', 'video/mp4; codecs="mpeg4"']],
  ['generic', 'a stream missing from the probe is still asked about, with the probed container', audioStream({ Codec: 'dts', CodecTag: undefined }), { containerMime: 'video/mp2t', source: { Container: 'ts' } }, ['audio/mp2t; codecs="dts"']],
  ['generic', 'through media-source the generic container is MP4', audioStream({ Codec: 'dts', CodecTag: undefined }), { mode: 'media-source', source: { Container: 'mkv' } }, ['audio/mp4; codecs="dts"']],

  // media-source
  ['media-source', 'video keeps the exact string inside video/mp4', videoStream(), { probed: probedVideo(), containerMime: 'video/x-matroska', mode: 'media-source' }, ['video/mp4; codecs="avc1.64001e"']],
  ['media-source', 'audio keeps the exact string inside audio/mp4', audioStream({ Codec: 'ac3', Channels: 6 }), { probed: probedAudio({ codec: 'ac3', codecString: 'ac-3', internalCodecId: 'A_AC3', channels: 6 }), containerMime: 'video/x-matroska', mode: 'media-source' }, ['audio/mp4; codecs="ac-3"']],
  ['media-source', 'QuickTime is only asked as MP4', videoStream(), { probed: probedVideo(), containerMime: 'video/quicktime', mode: 'media-source' }, ['video/mp4; codecs="avc1.64001e"']],

  // Dolby Vision without a compatible base layer
  ['Dolby Vision', 'HEVC with a dvh1 sample entry is asked as dvh1.<profile>.<level> and never as plain HEVC', dovi({ CodecTag: 'dvh1' }), { probed: probedVideo({ codec: 'hevc', codecString: 'hev1.2.4.L153.B0', internalCodecId: 'dvh1' }), containerMime: 'video/mp4' }, ['video/mp4; codecs="dvh1.05.06"']],
  ['Dolby Vision', 'HEVC with a dvhe tag is asked as dvhe', dovi({ CodecTag: 'dvhe' }), { containerMime: 'video/mp4' }, ['video/mp4; codecs="dvhe.05.06"']],
  ['Dolby Vision', 'without a fourcc (Matroska) both Dolby Vision prefixes are asked', dovi({ CodecTag: undefined }), { containerMime: 'video/x-matroska', source: { Container: 'mkv' } }, ['video/x-matroska; codecs="dvh1.05.06"', 'video/x-matroska; codecs="dvhe.05.06"']],
  ['Dolby Vision', 'AV1 Dolby Vision is asked as dav1', dovi({ Codec: 'av1', CodecTag: 'av01', DvProfile: 10, DvLevel: 9 }), { containerMime: 'video/mp4' }, ['video/mp4; codecs="dav1.10.09"']],
  ['Dolby Vision', 'the same Dolby Vision string is used through media-source', dovi({ CodecTag: 'dvh1' }), { containerMime: 'video/mp4', mode: 'media-source' }, ['video/mp4; codecs="dvh1.05.06"']]
];

describe.each(['exact', 'HEVC', 'PCM', 'QuickTime', 'generic', 'media-source', 'Dolby Vision'])('content types: %s', (group) => {
  const cases = contentTypeCases.filter(([caseGroup]) => caseGroup === group).map(([, ...rest]) => rest);

  test.each(cases)('%s', (_, stream, options, expected) => {
    const result = contentTypes(stream, options);

    expect(result).toEqual(expected);
  });
});

describe('Dolby Vision HDR fields', () => {
  test('without a compatible base layer the query declares PQ, BT.2020 and Dolby Vision metadata', () => {
    const members = firstMembers(dovi({ CodecTag: 'dvh1' }), { containerMime: 'video/mp4' });

    expect(members).toMatchObject({ transferFunction: 'pq', colorGamut: 'rec2020', hdrMetadataType: 'smpteSt2094-10' });
  });
});

describe('Dolby Vision with a compatible base layer is evaluated through its base layer', () => {
  const baseLayer = probedVideo({ codec: 'hevc', codecString: 'hev1.2.4.L153.B0', internalCodecId: 'hvc1', colorSpace: {} });
  const cases: [string, MediaStream['VideoRangeType'], Partial<VideoConfiguration>][] = [
    ['DOVIWithHDR10 is HDR10 video', 'DOVIWithHDR10', { transferFunction: 'pq', colorGamut: 'rec2020', hdrMetadataType: 'smpteSt2086' }],
    ['DOVIWithEL (profile 7, HDR10 base layer) is HDR10 video', 'DOVIWithEL', { transferFunction: 'pq', colorGamut: 'rec2020', hdrMetadataType: 'smpteSt2086' }],
    ['DOVIWithHDR10Plus is HDR10+ video', 'DOVIWithHDR10Plus', { transferFunction: 'pq', colorGamut: 'rec2020', hdrMetadataType: 'smpteSt2094-40' }],
    ['DOVIWithHLG is HLG video, which has no metadata type', 'DOVIWithHLG', { transferFunction: 'hlg', colorGamut: 'rec2020' }],
    ['DOVIWithSDR is SDR video: no HDR members', 'DOVIWithSDR', {}]
  ];

  test.each(cases)('%s', (_, rangeType, expected) => {
    const stream = videoStream({ Codec: 'hevc', CodecTag: 'hvc1', VideoRange: 'HDR', VideoRangeType: rangeType, DvProfile: 8, DvLevel: 6 });
    const options = { probed: baseLayer, containerMime: 'video/mp4' };
    const types = contentTypes(stream, options);
    const members = firstMembers(stream, options) as VideoConfiguration;
    const hdrMembers = {
      ...(members.transferFunction && { transferFunction: members.transferFunction }),
      ...(members.colorGamut && { colorGamut: members.colorGamut }),
      ...(members.hdrMetadataType && { hdrMetadataType: members.hdrMetadataType })
    };

    expect(new Set(types)).toEqual(new Set(['video/mp4; codecs="hvc1.2.4.L153.B0"']));
    expect(hdrMembers).toEqual(expected);
  });
});

describe('HDR10+ carries an HDR10 base layer: asked with its dynamic metadata, then as HDR10', () => {
  const hevcHdr = probedVideo({ codec: 'hevc', codecString: 'hev1.2.4.L153.B0', internalCodecId: 'hvc1', colorSpace: { primaries: 'bt2020', transfer: 'pq' }, hdr: true });
  const metadataTypes = (stream: MediaStream, mode: DecodingMode = 'file') =>
    candidates(stream, { probed: hevcHdr, containerMime: 'video/mp4', mode }).map(config => [config.video?.contentType, config.video?.hdrMetadataType]);
  const hdrStream = (rangeType: MediaStream['VideoRangeType'], extra: Partial<MediaStream> = {}) =>
    videoStream({ Codec: 'hevc', CodecTag: 'hvc1', VideoRange: 'HDR', VideoRangeType: rangeType, ColorTransfer: 'smpte2084', ColorPrimaries: 'bt2020', ...extra });
  const hdr10Plus = [['video/mp4; codecs="hvc1.2.4.L153.B0"', 'smpteSt2094-40'], ['video/mp4; codecs="hvc1.2.4.L153.B0"', 'smpteSt2086']];

  test.each(['HDR10Plus', 'DOVIWithHDR10Plus', 'DOVIWithELHDR10Plus'] as const)('%s: the same question with smpteSt2094-40, then with smpteSt2086', (rangeType) => {
    const result = metadataTypes(hdrStream(rangeType, { DvProfile: 8, DvLevel: 6 }));

    expect(result).toEqual(hdr10Plus);
  });

  test('through media source playback too', () => {
    const result = metadataTypes(hdrStream('HDR10Plus'), 'media-source');

    // Both HEVC prefixes are asked there (the server writes the container), each with both metadata types
    expect(result).toEqual([
      ['video/mp4; codecs="hvc1.2.4.L153.B0"', 'smpteSt2094-40'],
      ['video/mp4; codecs="hvc1.2.4.L153.B0"', 'smpteSt2086'],
      ['video/mp4; codecs="hev1.2.4.L153.B0"', 'smpteSt2094-40'],
      ['video/mp4; codecs="hev1.2.4.L153.B0"', 'smpteSt2086']
    ]);
  });

  test.each(['HDR10', 'DOVIWithHDR10', 'DOVIWithEL'] as const)('%s is asked once, as HDR10', (rangeType) => {
    const result = metadataTypes(hdrStream(rangeType, { DvProfile: 8, DvLevel: 6 }));

    expect(result).toEqual([['video/mp4; codecs="hvc1.2.4.L153.B0"', 'smpteSt2086']]);
  });

  test('Dolby Vision without a compatible base layer has no HDR10 layer to fall back to: only its Dolby Vision questions', () => {
    const result = candidates(dovi({ CodecTag: 'dvh1' }), { containerMime: 'video/mp4' }).map(config => config.video?.hdrMetadataType);

    expect(result).toEqual(['smpteSt2094-10']);
  });
});

describe('getHdrFields: HDR members only for HDR video', () => {
  const hdr10 = videoStream({ VideoRange: 'HDR', VideoRangeType: 'HDR10' });
  const cases: [string, MediaStream, ProbedTrack | undefined, HdrFields | undefined][] = [
    [
      'HDR10 from the probed colour space: PQ, BT.2020, static metadata',
      hdr10,
      probedVideo({ colorSpace: { primaries: 'bt2020', transfer: 'pq', matrix: 'bt2020-ncl' }, hdr: true }),
      { transferFunction: 'pq', colorGamut: 'rec2020', hdrMetadataType: 'smpteSt2086' }
    ],
    [
      'HDR10 without probe is completed from the server\'s colour fields',
      videoStream({ VideoRange: 'HDR', VideoRangeType: 'HDR10', ColorTransfer: 'smpte2084', ColorPrimaries: 'bt2020' }),
      undefined,
      { transferFunction: 'pq', colorGamut: 'rec2020', hdrMetadataType: 'smpteSt2086' }
    ],
    [
      'HDR10 with no colour data at all is completed from the range type (HDR10 is PQ on BT.2020)',
      hdr10,
      undefined,
      { transferFunction: 'pq', colorGamut: 'rec2020', hdrMetadataType: 'smpteSt2086' }
    ],
    [
      'HLG has no metadata type',
      videoStream({ VideoRange: 'HDR', VideoRangeType: 'HLG', ColorTransfer: 'arib-std-b67', ColorPrimaries: 'bt2020' }),
      undefined,
      { transferFunction: 'hlg', colorGamut: 'rec2020' }
    ],
    [
      'HDR10+ declares dynamic metadata',
      videoStream({ VideoRange: 'HDR', VideoRangeType: 'HDR10Plus', ColorTransfer: 'smpte2084' }),
      undefined,
      { transferFunction: 'pq', colorGamut: 'rec2020', hdrMetadataType: 'smpteSt2094-40' }
    ],
    [
      'P3 primaries become the p3 gamut',
      hdr10,
      probedVideo({ colorSpace: { primaries: 'smpte432', transfer: 'pq' }, hdr: true }),
      { transferFunction: 'pq', colorGamut: 'p3', hdrMetadataType: 'smpteSt2086' }
    ],
    ['SDR video has no HDR members', videoStream(), probedVideo(), undefined],
    ['a file whose own colour data says SDR is SDR even if the range type is unknown', videoStream({ VideoRangeType: 'Unknown' }), probedVideo(), undefined],
    [
      'a range type the server could not classify (DOVIInvalid) is decided by the colour data: PQ',
      videoStream({ VideoRange: 'HDR', VideoRangeType: 'DOVIInvalid', ColorTransfer: 'smpte2084' }),
      undefined,
      { transferFunction: 'pq', colorGamut: 'rec2020' }
    ],
    [
      'a range type the server could not classify (DOVIInvalid) is decided by the colour data: SDR',
      videoStream({ VideoRange: 'SDR', VideoRangeType: 'DOVIInvalid', ColorTransfer: 'bt709' }),
      undefined,
      undefined
    ]
  ];

  test.each(cases)('%s', (_, stream, probed, expected) => {
    const result = getHdrFields(stream, probed);

    expect(result).toEqual(expected);
  });

  test('the HDR members are part of the exact candidate', () => {
    const members = firstMembers(videoStream({ Codec: 'hevc', VideoRange: 'HDR', VideoRangeType: 'HDR10' }), {
      probed: probedVideo({
        codec: 'hevc',
        codecString: 'hev1.2.4.L93.B0',
        internalCodecId: 'hvc1',
        colorSpace: { primaries: 'bt2020', transfer: 'pq' },
        hdr: true
      }),
      containerMime: 'video/mp4'
    });

    expect(members).toMatchObject({ transferFunction: 'pq', colorGamut: 'rec2020', hdrMetadataType: 'smpteSt2086' });
  });
});

describe('transcoding targets are asked through media-source as MP4', () => {
  test('a video target with the output size, bitrate and frame rate', () => {
    const result = getVideoTargetCandidate(
      { codec: 'h264', codecString: 'avc1.640028' },
      { width: 1280, height: 720, bitrate: 5_000_000, framerate: 25 }
    );

    expect(result).toEqual({
      type: 'media-source',
      video: { contentType: 'video/mp4; codecs="avc1.640028"', width: 1280, height: 720, bitrate: 5_000_000, framerate: 25 }
    });
  });

  test('an audio target with the channel count as a string', () => {
    const result = getAudioTargetCandidate({ codec: 'aac', codecString: 'mp4a.40.2' }, { channels: 6, samplerate: 48_000 });

    expect(result).toEqual({
      type: 'media-source',
      audio: { contentType: 'audio/mp4; codecs="mp4a.40.2"', channels: '6', samplerate: 48_000 }
    });
  });
});
