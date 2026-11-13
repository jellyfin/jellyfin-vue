import { describe, expect, test } from 'vitest';
import {
  keepsCurrentPlayback,
  shouldCorrectWithLateProbe,
  type LateProbeCheck,
  type RenegotiationOutcome
} from '#/utils/playback-capabilities/renegotiation.ts';

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

describe('shouldCorrectWithLateProbe', () => {
  /**
   * An unverified direct play, corrected by the probe to an audio transcode, with nothing else going on
   */
  function check(overrides: Partial<LateProbeCheck> = {}): LateProbeCheck {
    return {
      playing: { unverified: true, method: 'DirectPlay' },
      corrected: { unverified: false, method: 'TranscodeAudio' },
      changePending: false,
      paused: false,
      ...overrides
    };
  }

  test('an unverified playback whose verified verdict asks for more is corrected', () => {
    expect(shouldCorrectWithLateProbe(check())).toBe(true);
    expect(shouldCorrectWithLateProbe(check({ playing: { unverified: true, method: 'Remux' }, corrected: { unverified: false, method: 'TranscodeVideo' } }))).toBe(true);
  });

  test('a playback whose verdict was verified already is left alone', () => {
    expect(shouldCorrectWithLateProbe(check({ playing: { unverified: false, method: 'DirectPlay' } }))).toBe(false);
  });

  test('a recomputed verdict that still relies on streams nobody could check corrects nothing', () => {
    expect(shouldCorrectWithLateProbe(check({ corrected: { unverified: true, method: 'TranscodeAudio' } }))).toBe(false);
  });

  test('never towards the same or a cheaper method than the one the server uses', () => {
    expect(shouldCorrectWithLateProbe(check({ corrected: { unverified: false, method: 'DirectPlay' } }))).toBe(false);
    // The server already encodes the audio (it chose more than the verdict asked for)
    expect(shouldCorrectWithLateProbe(check({ playing: { unverified: true, method: 'TranscodeAudio' } }))).toBe(false);
    expect(shouldCorrectWithLateProbe(check({ playing: { unverified: true, method: 'TranscodeVideo' } }))).toBe(false);
  });

  test('a corrected verdict that is unplayable keeps the current playback (for example, the policy forbids the transcode)', () => {
    expect(shouldCorrectWithLateProbe(check({ corrected: { unverified: false, method: 'Unplayable' } }))).toBe(false);
  });

  test('not while another change is pending', () => {
    expect(shouldCorrectWithLateProbe(check({ changePending: true }))).toBe(false);
  });

  test('not while paused: it is corrected when the playback resumes', () => {
    expect(shouldCorrectWithLateProbe(check({ paused: true }))).toBe(false);
  });
});
