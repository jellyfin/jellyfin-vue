import Vue from 'vue';
import timeUtils from '~/mixins/timeUtils.ts';

const TestComponent = new Vue({
  mixins: [timeUtils]
});

describe('timeUtils', () => {
  test('converts time from ms to ticks', () => {
    expect(TestComponent.ticksToMs(10000)).toEqual(1);
  });

  test('converts time from ticks to ms', () => {
    expect(TestComponent.msToTicks(1)).toEqual(10000);
  });
});
