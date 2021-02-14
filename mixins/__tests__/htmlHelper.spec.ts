import Vue from 'vue';
import htmlHelper from '../htmlHelper';

const TestComponent = new Vue({
  mixins: [htmlHelper]
});

describe('formsHelper', () => {
  test('correctly sanitizes HTML', () => {
    /*
      NOTE: It is not our place to test if the library used is secure.
      We just want to check if it's actually doing anything.
    */
    expect(TestComponent.sanitizeHtml('text\ntext\ntext')).toBe(
      'text<br>text<br>text'
    );
    expect(TestComponent.sanitizeHtml('texttexttext')).toBe('texttexttext');
  });
});
