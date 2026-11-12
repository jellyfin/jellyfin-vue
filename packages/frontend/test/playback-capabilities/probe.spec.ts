import { afterEach, describe, expect, test, vi } from 'vitest';
import { probedAudio, probeOk } from './fixtures.ts';
import {
  isCurrentProbe,
  isRememberedForSession,
  probeMediaSource,
  PROBE_FORMAT_VERSION,
  PROBE_READER_VERSION,
  type ProbeResult
} from '#/utils/playback-capabilities/probe.ts';

/**
 * The version of the installed mediabunny, read from its own manifest, three levels above its entry module
 * (`dist/modules/src/index.js`): its exports do not list `package.json`
 */
async function getInstalledMediabunnyVersion(): Promise<string> {
  const manifest = new URL('../../../package.json', import.meta.resolve('mediabunny')).href;
  const { default: content } = await import(/* @vite-ignore */ manifest, { with: { type: 'json' } }) as { default: { name: string; version: string } };

  expect(content.name).toBe('mediabunny');

  return content.version;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('every probe result says which version of the probe and of mediabunny read it', () => {
  test('the reader version is the version of the installed mediabunny', async () => {
    expect(PROBE_READER_VERSION).toBe(await getInstalledMediabunnyVersion());
  });

  test('a probe that fails carries both versions too', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Failed to fetch')));

    const result = await probeMediaSource('https://server/Videos/item/stream?Static=true');

    expect(result).toMatchObject({ status: 'failed', formatVersion: PROBE_FORMAT_VERSION, readerVersion: PROBE_READER_VERSION });
  });
});

describe('isCurrentProbe: a stored result read by another version counts as missing', () => {
  const current = probeOk('audio/flac', [], [probedAudio({ codec: 'flac', codecString: 'flac', internalCodecId: 'flac' })], true);

  test('a result read by this probe and this mediabunny is used', () => {
    expect(isCurrentProbe(current)).toBe(true);
  });

  test('a result stored before results carried versions (here, before containerImpliesCodec existed) is read again', () => {
    const older = Object.fromEntries(Object.entries(current)
      .filter(([key]) => !['formatVersion', 'readerVersion', 'containerImpliesCodec'].includes(key)));

    expect(isCurrentProbe(older)).toBe(false);
  });

  test('a result of another shape of the probe is read again', () => {
    expect(isCurrentProbe({ ...current, formatVersion: PROBE_FORMAT_VERSION - 1 })).toBe(false);
  });

  test('a failure stored by another mediabunny is read again: the new one may read the file', () => {
    const failure: ProbeResult = {
      formatVersion: PROBE_FORMAT_VERSION,
      readerVersion: '0.0.1',
      status: 'failed',
      reason: 'parse-error',
      detail: 'Unsupported codec',
      cacheable: true,
      stats: { requests: 1, bytes: 1000, durationMs: 10 }
    };

    expect(isCurrentProbe(failure)).toBe(false);
  });
});

describe('isRememberedForSession: a failure that would cost as much every time is not tried again this session', () => {
  const failure = (reason: Extract<ProbeResult, { status: 'failed' }>['reason']): ProbeResult => ({
    formatVersion: PROBE_FORMAT_VERSION,
    readerVersion: PROBE_READER_VERSION,
    status: 'failed',
    reason,
    detail: '',
    cacheable: false,
    stats: { requests: 9, bytes: 16 * 2 ** 20, durationMs: 900 }
  });

  test('a probe that ran out of its byte budget is remembered: the next one would read as much again', () => {
    const result = failure('budget-exceeded');

    expect(isRememberedForSession(result)).toBe(true);
  });

  test.each(['timeout', 'network', 'http-error', 'range-unsupported', 'aborted'] as const)('a %s failure is not: it may not happen again', (reason) => {
    const result = failure(reason);

    expect(isRememberedForSession(result)).toBe(false);
  });

  test('a result that depends only on the file is stored instead', () => {
    const stored = probeOk('video/mp4', [], [probedAudio()]);

    expect(isRememberedForSession(stored)).toBe(false);
  });
});

/**
 * == A FILE LARGER THAN ONE RANGE WINDOW, SERVED CROSS-ORIGIN ==
 *
 * A cross-origin response hides `Content-Range` from the page (it is not a CORS-safelisted header, and Jellyfin 12.4
 * does not expose it: measured), so mediabunny can only take the file size from `Content-Length`, which for a range
 * window is the window's length.
 */
const TS_PACKET = 188;

/**
 * The CRC of an MPEG-TS section
 */
function crc32Mpeg(bytes: number[]): number {
  let crc = 0xFF_FF_FF_FF;

  for (const byte of bytes) {
    crc ^= byte << 24;

    for (let bit = 0; bit < 8; bit++) {
      crc = (crc & 0x80_00_00_00) ? ((crc << 1) ^ 0x04_C1_1D_B7) : (crc << 1);
      crc >>>= 0;
    }
  }

  return crc >>> 0;
}

/**
 * One MPEG-TS packet carrying the payload (padded with an adaptation field)
 */
function tsPacket(pid: number, payload: number[], counter: number): Uint8Array {
  const packet = new Uint8Array(TS_PACKET).fill(0xFF);
  const stuffing = TS_PACKET - 4 - payload.length;

  packet.set([0x47, 0x40 | ((pid >> 8) & 0x1F), pid & 0xFF, 0x30 | (counter & 0xF), stuffing - 1]);

  if (stuffing > 1) {
    packet[5] = 0;
  }

  packet.set(payload, 4 + stuffing);

  return packet;
}

/**
 * A PSI section with its CRC, after a pointer field
 */
function tsSection(tableId: number, body: number[]): number[] {
  const length = 5 + body.length + 4;
  const all = [tableId, 0xB0 | ((length >> 8) & 0x0F), length & 0xFF, 0, 1, 0xC1, 0, 0, ...body];
  const crc = crc32Mpeg(all);

  return [0, ...all, (crc >>> 24) & 0xFF, (crc >>> 16) & 0xFF, (crc >>> 8) & 0xFF, crc & 0xFF];
}

/**
 * A PES packet of one silent ADTS (AAC-LC, 48 kHz, stereo) frame
 */
function aacPes(pts: number): number[] {
  const frame = [0xFF, 0xF1, 0x4C, 0x80, 0x03, 0x7F, 0xFC, ...Array.from({ length: 20 }, () => 0)];
  const header = [0x80, 0x80, 0x05, 0x21 | (((pts >> 30) & 0x7) << 1), (pts >> 22) & 0xFF, 0x01 | (((pts >> 15) & 0x7F) << 1), (pts >> 7) & 0xFF, 0x01 | ((pts & 0x7F) << 1)];
  const length = header.length + frame.length;

  return [0, 0, 1, 0xC0, (length >> 8) & 0xFF, length & 0xFF, ...header, ...frame];
}

/**
 * An MPEG-TS of two AAC streams, the second of which only starts after `secondFrom` bytes
 */
function twoAudioTs(totalBytes: number, secondFrom: number): Uint8Array {
  const pat = tsSection(0x00, [0, 1, 0xE0 | (0x10_00 >> 8), 0x10_00 & 0xFF]);
  const pmt = tsSection(0x02, [0xE1, 0x01, 0xF0, 0x00, 0x0F, 0xE1, 0x01, 0xF0, 0x00, 0x0F, 0xE1, 0x02, 0xF0, 0x00]);
  const packets: Uint8Array[] = [];
  let pts = 90_000;
  let counter = 0;

  while (packets.length * TS_PACKET < totalBytes) {
    packets.push(tsPacket(0, pat, counter), tsPacket(0x10_00, pmt, counter), tsPacket(0x01_01, aacPes(pts), counter));

    if (packets.length * TS_PACKET >= secondFrom) {
      packets.push(tsPacket(0x01_02, aacPes(pts), counter));
    }

    pts += 1920;
    counter++;
  }

  const file = new Uint8Array(packets.length * TS_PACKET);

  for (const [index, packet] of packets.entries()) {
    file.set(packet, index * TS_PACKET);
  }

  return file;
}

/**
 * Serves a file the way a cross-origin server is seen from the page: range requests answered with 206 and the bytes
 * asked for, `Content-Length` readable, `Content-Range` hidden
 */
function serveCrossOrigin(file: Uint8Array): void {
  vi.stubGlobal('fetch', (_input: RequestInfo | URL, init?: RequestInit) => {
    const range = /^bytes=(\d+)-(\d*)$/.exec(new Headers(init?.headers).get('Range') ?? '');
    const start = Number(range?.[1] ?? 0);
    const end = Math.min(range?.[2] ? Number(range[2]) : file.length - 1, file.length - 1);
    const body = file.slice(start, end + 1);

    return Promise.resolve(new Response(body, { status: 206, headers: { 'Content-Length': String(body.length) } }));
  });
}

describe('a file larger than one range window, whose server hides Content-Range from the page', () => {
  const file = twoAudioTs(3 * 2 ** 20, 2.5 * 2 ** 20);

  test('with the size the server reports for it, the probe reads the whole file: both streams are found', async () => {
    serveCrossOrigin(file);

    const result = await probeMediaSource('https://server/Videos/item/stream.ts?Static=true', { size: file.length });

    expect(result.status === 'ok' && result.audio.length).toBe(2);
  });

  test('without it, mediabunny would take the first window for the whole file', async () => {
    serveCrossOrigin(file);

    const result = await probeMediaSource('https://server/Videos/item/stream.ts?Static=true');

    expect(result.status === 'ok' && result.audio.length).toBe(1);
  });
});
