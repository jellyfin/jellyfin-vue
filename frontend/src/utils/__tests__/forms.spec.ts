import { getItemizedSelect } from '../forms';

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

describe('utils: forms', () => {
  it('correctly itemizes the array of items', () => {
    expect(getItemizedSelect(FORMS_TEST_INPUT)).toMatchObject(
      FORMS_EXPECTED_OUTPUT
    );
  });
});
