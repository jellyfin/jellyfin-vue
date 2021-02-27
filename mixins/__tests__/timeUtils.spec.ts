import Vue from 'vue';
import timeUtils from '~/mixins/timeUtils.ts';

const TestComponent = new Vue({
  mixins: [timeUtils]
});

describe('mixin: timeUtils', () => {
  it('converts time from ms to ticks', () => {
    expect(TestComponent.ticksToMs(10000)).toEqual(1);

    expect(TestComponent.ticksToMs(undefined)).toEqual(0);

    expect(TestComponent.ticksToMs(null)).toEqual(0);
  });

  it('converts time from ticks to ms', () => {
    expect(TestComponent.msToTicks(1)).toEqual(10000);
  });

  it('formats time properly', () => {
    expect(TestComponent.formatTime(5)).toEqual('0:05');

    expect(TestComponent.formatTime(10)).toEqual('0:10');

    expect(TestComponent.formatTime(65)).toEqual('1:05');

    expect(TestComponent.formatTime(70)).toEqual('1:10');

    expect(TestComponent.formatTime(3665)).toEqual('1:01:05');

    expect(TestComponent.formatTime(4210)).toEqual('1:10:10');
  });
});
