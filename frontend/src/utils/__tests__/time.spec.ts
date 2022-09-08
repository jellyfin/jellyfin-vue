import { formatTime, ticksToMs, msToTicks } from '~/utils/time';

describe('mixin: timeUtils', () => {
  it('converts time from ms to ticks', () => {
    expect(ticksToMs(10000)).toBe(1);

    expect(ticksToMs(undefined)).toBe(0);

    expect(ticksToMs(null)).toBe(0);
  });

  it('converts time from ticks to ms', () => {
    expect(msToTicks(1)).toBe(10000);
  });

  it('formats time properly', () => {
    expect(formatTime(5)).toBe('0:05');

    expect(formatTime(10)).toBe('0:10');

    expect(formatTime(65)).toBe('1:05');

    expect(formatTime(70)).toBe('1:10');

    expect(formatTime(3665)).toBe('1:01:05');

    expect(formatTime(4210)).toBe('1:10:10');
  });
});
