import Vue from 'vue';
import htmlHelper from '../htmlHelper';

const TestComponent = new Vue({
  mixins: [htmlHelper]
});

test('Correctly sanitizes HTML and replaces new lines with <br> tags', () => {
  expect(TestComponent.sanitizeHtml('text\ntext\ntext')).toBe(
    'text<br>text<br>text'
  );
  expect(TestComponent.sanitizeHtml('texttexttext')).toBe('texttexttext');
});
