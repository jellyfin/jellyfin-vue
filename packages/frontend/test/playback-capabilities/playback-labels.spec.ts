import { describe, expect, test } from 'vitest';
import type { PlaybackChangeReason } from '#/store/playback-quality.ts';
import { getMethodChangeNotice, getPlaybackChangeReasonName, getPlaybackMethodName } from '#/utils/playback-labels.ts';

/**
 * A translation function that shows the key and its values, so the tests see which text is used with what
 */
const t = (key: string, options?: Record<string, unknown>): string => options ? `${key}${JSON.stringify(options)}` : key;

describe('the method-change notice follows the cause of the change, in the statistics panel\'s words', () => {
  test.each<PlaybackChangeReason>(['mediaError', 'hlsMediaError', 'hlsCodecError', 'noPicture', 'noFrames'])(
    'a failure (%s) is told as a problem',
    (reason) => {
      expect(getMethodChangeNotice(t, reason, 'Remux')).toBe(t('playbackMethodChanged', { method: getPlaybackMethodName(t, 'Remux') }));
    }
  );

  test.each<PlaybackChangeReason>(['lateProbe', 'manual'])('a change that is not a problem (%s) gives its own cause', (reason) => {
    const notice = getMethodChangeNotice(t, reason, 'TranscodeAudio');

    expect(notice).not.toContain('playbackMethodChanged{');
    expect(notice).toContain(JSON.stringify(getPlaybackChangeReasonName(t, reason)).slice(1, -1));
    expect(notice).toContain(getPlaybackMethodName(t, 'TranscodeAudio'));
  });
});
