import Vue from 'vue';
import timeUtils from '~/mixins/timeUtils';

const TestComponent = new Vue({
  mixins: [timeUtils]
});

describe('mixin: timeUtils', () => {
  it('converts time from ms to ticks', () => {
    expect(TestComponent.ticksToMs(10000)).toBe(1);

    expect(TestComponent.ticksToMs(undefined)).toBe(0);

    expect(TestComponent.ticksToMs(null)).toBe(0);
  });

  it('converts time from ticks to ms', () => {
    expect(TestComponent.msToTicks(1)).toBe(10000);
  });

  it('formats time properly', () => {
    expect(TestComponent.formatTime(5)).toBe('0:05');

    expect(TestComponent.formatTime(10)).toBe('0:10');

    expect(TestComponent.formatTime(65)).toBe('1:05');

    expect(TestComponent.formatTime(70)).toBe('1:10');

    expect(TestComponent.formatTime(3665)).toBe('1:01:05');

    expect(TestComponent.formatTime(4210)).toBe('1:10:10');
  });
});
