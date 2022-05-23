import { sanitizeHtml } from '../html';

describe('mixin: htmlHelper', () => {
  it('correctly sanitizes HTML', () => {
    /*
      NOTE: It is not our place to test if the library used is secure.
      We just want to check if it's actually doing anything.
    */
    expect(sanitizeHtml('text\ntext\ntext')).toBe('text<br>text<br>text');
    expect(sanitizeHtml('texttexttext')).toBe('texttexttext');
  });
});
