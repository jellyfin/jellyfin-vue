import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  createFallbackQuery,
  createOracle,
  getConfigurationKey,
  UNSUPPORTED,
  type CapabilityAnswer
} from '#/utils/playback-capabilities/oracle.ts';

const video = (contentType: string): MediaDecodingConfiguration => ({
  type: 'file',
  video: { contentType, width: 640, height: 360, bitrate: 1_000_000, framerate: 25 }
});
const yes: CapabilityAnswer = { supported: true, smooth: true, powerEfficient: false };

/**
 * A browser query that never settles, like decodingInfo in some WebViews
 */
function neverAnswers(): Promise<CapabilityAnswer> {
  return new Promise<CapabilityAnswer>(() => {
    // Never settles
  });
}

/**
 * A query function that counts its calls and answers what it is told
 */
function countingQuery(answer: CapabilityAnswer | (() => Promise<CapabilityAnswer>) = yes) {
  const calls: MediaDecodingConfiguration[] = [];
  const query = async (config: MediaDecodingConfiguration) => {
    calls.push(config);

    return typeof answer === 'function' ? answer() : answer;
  };

  return { calls, query };
}

describe('getConfigurationKey: a stable key per configuration', () => {
  test('the order of the members does not matter', () => {
    const a = getConfigurationKey({ type: 'file', video: { contentType: 'video/mp4', width: 1, height: 2, bitrate: 3, framerate: 4 } });
    const b = getConfigurationKey({ video: { framerate: 4, bitrate: 3, height: 2, width: 1, contentType: 'video/mp4' }, type: 'file' });

    expect(a).toBe(b);
  });

  test('an absent member and an undefined member are the same question', () => {
    const a = getConfigurationKey({ type: 'file', audio: { contentType: 'audio/mp4', bitrate: undefined } });
    const b = getConfigurationKey({ type: 'file', audio: { contentType: 'audio/mp4' } });

    expect(a).toBe(b);
  });

  const different: [string, MediaDecodingConfiguration, MediaDecodingConfiguration][] = [
    ['the content type', video('video/mp4; codecs="avc1.64001e"'), video('video/mp4; codecs="avc1.640028"')],
    ['the type of playback', video('video/mp4'), { ...video('video/mp4'), type: 'media-source' }],
    ['any value', video('video/mp4'), { type: 'file', video: { ...video('video/mp4').video!, framerate: 50 } }],
    ['video versus audio', { type: 'file', video: { contentType: 'x', width: 1, height: 1, bitrate: 1, framerate: 1 } }, { type: 'file', audio: { contentType: 'x' } }]
  ];

  test.each(different)('configurations that differ in %s get different keys', (_, a, b) => {
    const keys = new Set([getConfigurationKey(a), getConfigurationKey(b)]);

    expect(keys.size).toBe(2);
  });
});

describe('createOracle: memoised, de-duplicated, never rejects', () => {
  test('asking the same thing twice asks the browser once', async () => {
    const { calls, query } = countingQuery();
    const oracle = createOracle(query);

    await oracle.query(video('video/mp4'));

    const answer = await oracle.query(video('video/mp4'));

    expect(calls).toHaveLength(1);
    expect(answer).toEqual(yes);
  });

  test('concurrent identical questions share one browser query', async () => {
    const { calls, query } = countingQuery();
    const oracle = createOracle(query);
    const answers = await Promise.all([oracle.query(video('video/mp4')), oracle.query(video('video/mp4'))]);

    expect(calls).toHaveLength(1);
    expect(answers).toEqual([yes, yes]);
  });

  test('different questions are asked separately', async () => {
    const { calls, query } = countingQuery();
    const oracle = createOracle(query);

    await Promise.all([oracle.query(video('video/mp4; codecs="a"')), oracle.query(video('video/mp4; codecs="b"'))]);

    expect(calls).toHaveLength(2);
  });

  test('a rejection (for example the TypeError of an invalid configuration) means unsupported', async () => {
    const oracle = createOracle(() => Promise.reject(new TypeError('Invalid codecs')));
    const answer = await oracle.query(video('video/mp4; codecs="a,b"'));

    expect(answer).toEqual(UNSUPPORTED);
  });

  test('the answer is reduced to the three booleans', async () => {
    const answerWithExtras = { supported: true, smooth: false, powerEfficient: true, configuration: {} };
    const oracle = createOracle(() => Promise.resolve(answerWithExtras));
    const answer = await oracle.query(video('video/mp4'));

    expect(answer).toEqual({ supported: true, smooth: false, powerEfficient: true });
  });

  test('clear() forgets every answer', async () => {
    const { calls, query } = countingQuery();
    const oracle = createOracle(query);

    await oracle.query(video('video/mp4'));
    oracle.clear();
    await oracle.query(video('video/mp4'));

    expect(calls).toHaveLength(2);
  });
});

describe('createOracle: browsers that never answer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('a question without answer within the timeout counts as unsupported', async () => {
    const oracle = createOracle(neverAnswers, { timeoutMs: 1000 });
    const pending = oracle.query(video('video/mp4'));

    await vi.advanceTimersByTimeAsync(1000);

    const answer = await pending;

    expect(answer).toEqual(UNSUPPORTED);
  });

  test('the timed out question is not asked again while the browser has not answered', async () => {
    const { calls, query } = countingQuery(neverAnswers);
    const oracle = createOracle(query, { timeoutMs: 1000 });
    const first = oracle.query(video('video/mp4'));

    await vi.advanceTimersByTimeAsync(1000);
    await first;

    const second = oracle.query(video('video/mp4'));

    await vi.advanceTimersByTimeAsync(1000);
    await second;

    expect(calls).toHaveLength(1);
  });

  test('a late answer replaces the timeout for later questions', async () => {
    const late = Promise.withResolvers<CapabilityAnswer>();
    const oracle = createOracle(() => late.promise, { timeoutMs: 1000 });
    const first = oracle.query(video('video/mp4'));

    await vi.advanceTimersByTimeAsync(1000);

    const firstAnswer = await first;

    late.resolve(yes);
    await vi.advanceTimersByTimeAsync(0);

    const secondAnswer = await oracle.query(video('video/mp4'));

    expect([firstAnswer, secondAnswer]).toEqual([UNSUPPORTED, yes]);
  });
});

describe('createFallbackQuery: only for engines without mediaCapabilities', () => {
  const canPlayType = (type: string) => type.includes('avc1') ? 'probably' : '';
  const isTypeSupported = (type: string) => type.includes('hvc1');

  test('direct play asks canPlayType with the same string', async () => {
    const query = createFallbackQuery({ canPlayType, isTypeSupported });
    const answers = await Promise.all([query(video('video/mp4; codecs="avc1.64001e"')), query(video('video/mp4; codecs="hvc1.1"'))]);

    expect(answers.map(answer => answer.supported)).toEqual([true, false]);
  });

  test('"maybe" from canPlayType counts as supported', async () => {
    const query = createFallbackQuery({ canPlayType: () => 'maybe', isTypeSupported });
    const answer = await query(video('video/mp4; codecs="avc1.64001e"'));

    expect(answer.supported).toBe(true);
  });

  test('media-source asks isTypeSupported with the same string', async () => {
    const query = createFallbackQuery({ canPlayType, isTypeSupported });
    const answer = await query({ ...video('video/mp4; codecs="hvc1.1"'), type: 'media-source' });

    expect(answer.supported).toBe(true);
  });

  test('without any media source implementation, media-source is unsupported', async () => {
    const query = createFallbackQuery({ canPlayType });
    const answer = await query({ ...video('video/mp4; codecs="avc1.64001e"'), type: 'media-source' });

    expect(answer).toEqual(UNSUPPORTED);
  });

  test('a supported answer is assumed smooth and power efficient (nothing else to go by)', async () => {
    const query = createFallbackQuery({ canPlayType, isTypeSupported });
    const answer = await query(video('video/mp4; codecs="avc1.64001e"'));

    expect(answer).toEqual({ supported: true, smooth: true, powerEfficient: true });
  });

  test('audio configurations are asked the same way', async () => {
    const query = createFallbackQuery({ canPlayType: type => type.startsWith('audio/') ? 'probably' : '', isTypeSupported });
    const answer = await query({ type: 'file', audio: { contentType: 'audio/mp4; codecs="mp4a.40.2"' } });

    expect(answer.supported).toBe(true);
  });
});
