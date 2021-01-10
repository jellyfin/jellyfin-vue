import Vue from 'vue';
import formsHelper from '../formsHelper';

const TestComponent = new Vue({
  mixins: [formsHelper]
});

const FORMS_TEST_INPUT = [
  { name: 'aaa' },
  { name: 'bbb' },
  { name: 'ccc' },
  { name: 'ddd' },
  { name: 'eee' }
];

const FORMS_EXPECTED_OUTPUT = [
  { value: { name: 'aaa' } },
  { value: { name: 'bbb' } },
  { value: { name: 'ccc' } },
  { value: { name: 'ddd' } },
  { value: { name: 'eee' } }
];

test('Correctly itemizes the array of items', () => {
  expect(TestComponent.getItemizedSelect(FORMS_TEST_INPUT)).toMatchObject(
    FORMS_EXPECTED_OUTPUT
  );
});
