import type * as monaco from 'monaco-editor';

import { Labels } from '../../../config/labels';
import { styles } from '../../../config/styles';

export const MONACO_OPTIONS: monaco.editor.IStandaloneEditorConstructionOptions = {
  fontFamily: styles.default.fontFamily,
  fixedOverflowWidgets: true,
  autoClosingBrackets: 'always',
  autoClosingQuotes: 'always',
  autoClosingDelete: 'always',
  autoClosingOvertype: 'always',
  autoIndent: 'full',
  placeholder: Labels.PromQlPlaceHolder,
  bracketPairColorization: {
    enabled: true
  },
  minimap: { enabled: false },
  lineNumbers: 'off',
  roundedSelection: true,
  scrollBeyondLastLine: false,
  readOnly: false,
  fontSize: 18,
  suggestFontSize: 16,
  suggestLineHeight: 30,
  hideCursorInOverviewRuler: true,
  overviewRulerBorder: false,
  wordWrap: 'off',
  lineDecorationsWidth: 0,
  scrollbar: {
    vertical: 'hidden',
    horizontal: 'auto'
  },
  suggest: {
    showIcons: true,
    snippetsPreventQuickSuggestions: false,
    localityBonus: true
  }
};
