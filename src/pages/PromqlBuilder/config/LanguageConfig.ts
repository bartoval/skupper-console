import { languages } from 'monaco-editor';

type IRichLanguageConfiguration = languages.LanguageConfiguration;

export const languageConfiguration: IRichLanguageConfiguration = {
  /**
   * Defines the regular expression for what constitutes a "word".
   *
   *   - (-?\d*\.\d\w*): Matches floating-point numbers (e.g., -1.23, 0.5, 123.456).
   *   - ([^`~!#%^&*()\-=+[{\]}\\|;:'",.<>/?\s]+): Matches any sequence of characters
   *     that are not whitespace or common punctuation/special characters.
   */
  wordPattern: /(-?\d*\.\d\w*)|([^`~!#%^&*()\-=+[{\]}\\|;:'",.<>/?\s]+)/g,
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')']
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" }
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
    { open: '<', close: '>' }
  ],
  folding: {}
};
