import { describe, expect, test } from 'vitest';
import type { MediaStream } from '@jellyfin/sdk/lib/generated-client';
import { subtitleStream as subtitle } from './fixtures.ts';
import {
  classifySubtitle,
  DEFAULT_SUBTITLE_RENDERERS,
  getSubtitleDelivery,
  getSubtitleProfiles,
  type SubtitleClass,
  type SubtitleRenderer
} from '#/utils/playback-capabilities/subtitles.ts';

const extendedRegistry: SubtitleRenderer[] = [
  ...DEFAULT_SUBTITLE_RENDERERS,
  { name: 'vobsub-renderer', formats: ['dvdsub', 'ASS'] }
];

describe('classifySubtitle: the four classes', () => {
  const cases: [string, MediaStream, SubtitleClass][] = [
    ['WebVTT is rendered natively by the browser', subtitle('webvtt', true), 'native'],
    ['the short vtt name is native too', subtitle('vtt', true), 'native'],
    ['codec names are compared case-insensitively (native)', subtitle('WebVTT', true), 'native'],
    ['ASS is drawn by a client renderer', subtitle('ass', true), 'renderer'],
    ['SSA is drawn by a client renderer', subtitle('ssa', true), 'renderer'],
    ['PGS is drawn by a client renderer', subtitle('pgssub', false), 'renderer'],
    ['codec names are compared case-insensitively (renderer)', subtitle('PGSSUB', false), 'renderer'],
    ['SubRip is a text format the server converts to WebVTT', subtitle('subrip', true), 'server-text'],
    ['mov_text is a text format the server converts to WebVTT', subtitle('mov_text', true), 'server-text'],
    ['any other stream the server flags as text is converted by the server', subtitle('some-future-text', true), 'server-text'],
    ['DVD bitmap subtitles have to be burnt in', subtitle('DVDSUB', false), 'burn-in'],
    ['DVB bitmap subtitles have to be burnt in', subtitle('dvbsub', false), 'burn-in'],
    ['an unknown non-text format has to be burnt in', subtitle('some-future-bitmap', false), 'burn-in'],
    ['a stream without codec and not flagged as text has to be burnt in', subtitle('', false, { Codec: undefined }), 'burn-in']
  ];

  test.each(cases)('%s', (_, stream, expected) => {
    const result = classifySubtitle(stream);

    expect(result).toBe(expected);
  });
});

describe('classifySubtitle: external versus embedded does not matter', () => {
  const cases: [string, string, boolean, SubtitleClass][] = [
    ['an ASS file is a renderer subtitle either way', 'ass', true, 'renderer'],
    ['a SubRip file is converted by the server either way', 'subrip', true, 'server-text'],
    ['a WebVTT file is native either way', 'webvtt', true, 'native']
  ];

  test.each(cases)('%s', (_, codec, isText, expected) => {
    const external = classifySubtitle(subtitle(codec, isText, { IsExternal: true }));
    const embedded = classifySubtitle(subtitle(codec, isText, { IsExternal: false }));

    expect([external, embedded]).toEqual([expected, expected]);
  });
});

describe('classifySubtitle: streams the server cannot deliver externally', () => {
  const cases: [string, MediaStream, SubtitleClass][] = [
    ['a WebVTT stream that cannot be delivered externally is burnt in', subtitle('webvtt', true, { SupportsExternalStream: false }), 'burn-in'],
    ['an ASS stream that cannot be delivered externally is burnt in', subtitle('ass', true, { SupportsExternalStream: false }), 'burn-in'],
    ['a SubRip stream that cannot be delivered externally is burnt in', subtitle('subrip', true, { SupportsExternalStream: false }), 'burn-in'],
    ['a stream that does not say whether it can be delivered externally is not penalised', subtitle('ass', true, { SupportsExternalStream: undefined }), 'renderer']
  ];

  test.each(cases)('%s', (_, stream, expected) => {
    const result = classifySubtitle(stream);

    expect(result).toBe(expected);
  });
});

describe('classifySubtitle: the renderer registry is data the renderers\' owner can extend', () => {
  const cases: [string, MediaStream, readonly SubtitleRenderer[], SubtitleClass][] = [
    ['a format becomes a renderer subtitle once a renderer declares it', subtitle('DVDSUB', false), extendedRegistry, 'renderer'],
    ['without renderers, ASS falls back to server conversion because the server flags it as text', subtitle('ass', true), [], 'server-text'],
    ['without renderers, PGS has to be burnt in because it is not text', subtitle('pgssub', false), [], 'burn-in']
  ];

  test.each(cases)('%s', (_, stream, registry, expected) => {
    const result = classifySubtitle(stream, registry);

    expect(result).toBe(expected);
  });

  test('the default registry declares what the app renders today: ASS/SSA and PGS', () => {
    const formats = DEFAULT_SUBTITLE_RENDERERS.flatMap(renderer => renderer.formats);

    expect(new Set(formats)).toEqual(new Set(['ass', 'ssa', 'pgssub']));
  });
});

describe('getSubtitleDelivery', () => {
  const cases: [SubtitleClass, string][] = [
    ['native', 'External'],
    ['renderer', 'External'],
    ['server-text', 'External'],
    ['burn-in', 'Encode']
  ];

  test.each(cases)('%s subtitles are delivered as %s', (subtitleClass, delivery) => {
    const result = getSubtitleDelivery(subtitleClass);

    expect(result).toBe(delivery);
  });
});

describe('getSubtitleProfiles: what is declared to the server', () => {
  test('declares WebVTT and every registry format', () => {
    const formats = new Set(getSubtitleProfiles().map(profile => profile.Format));
    const expected = ['vtt', ...DEFAULT_SUBTITLE_RENDERERS.flatMap(renderer => renderer.formats)];

    expect(expected.filter(format => !formats.has(format))).toEqual([]);
  });

  test('everything is delivered as an external file, never Embed or Hls', () => {
    const methods = new Set(getSubtitleProfiles().map(profile => profile.Method));

    expect(methods).toEqual(new Set(['External']));
  });

  test('follows an extended registry, without duplicates', () => {
    const formats = getSubtitleProfiles(extendedRegistry).map(profile => profile.Format?.toLowerCase());

    expect(formats).toContain('dvdsub');
    expect(formats).toHaveLength(new Set(formats).size);
  });
});
