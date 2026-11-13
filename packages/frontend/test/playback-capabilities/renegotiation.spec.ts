import { describe, expect, test } from 'vitest';
import { keepsCurrentPlayback, type RenegotiationOutcome } from '#/utils/playback-capabilities/renegotiation.ts';

describe('keepsCurrentPlayback', () => {
  const outcomes: RenegotiationOutcome[] = ['playable', 'unplayable', 'failed'];

  test('an improvement the app started by itself that is unplayable or fails leaves the working playback as it is', () => {
    expect(keepsCurrentPlayback('improve', { playing: true, outcome: 'unplayable' })).toBe(true);
    expect(keepsCurrentPlayback('improve', { playing: true, outcome: 'failed' })).toBe(true);
  });

  test('an improvement that plays replaces the playback', () => {
    expect(keepsCurrentPlayback('improve', { playing: true, outcome: 'playable' })).toBe(false);
  });

  test('without a working playback there is nothing to keep: the result is shown, whatever it is', () => {
    for (const outcome of outcomes) {
      expect(keepsCurrentPlayback('improve', { playing: false, outcome })).toBe(false);
    }
  });

  test('after a hard failure or a change the user asked for, the result replaces the playback, unplayable or not', () => {
    for (const outcome of outcomes) {
      expect(keepsCurrentPlayback('replace', { playing: true, outcome })).toBe(false);
      expect(keepsCurrentPlayback('replace', { playing: false, outcome })).toBe(false);
    }
  });
});
