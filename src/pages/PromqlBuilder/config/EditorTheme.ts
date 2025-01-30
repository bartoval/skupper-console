import type { editor } from 'monaco-editor';

import { TOKEN_TYPES } from '../PromqlBuilder.constants';

export const editorTheme: editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    { token: TOKEN_TYPES.AGGREGATOR, foreground: '0000FF', fontStyle: 'bold' },
    { token: TOKEN_TYPES.FUNCTION, foreground: '795E26', fontStyle: 'bold' },
    { token: TOKEN_TYPES.KEYWORD, foreground: '0000FF' },
    { token: TOKEN_TYPES.METRIC, foreground: '267f99' },
    { token: TOKEN_TYPES.LABEL, foreground: '001080' },
    { token: TOKEN_TYPES.NUMBER, foreground: '098658' },
    { token: TOKEN_TYPES.STRING, foreground: 'A31515' },
    { token: TOKEN_TYPES.OPERATOR, foreground: '000000', fontStyle: 'bold' },
    { token: TOKEN_TYPES.DELIMITER, foreground: '000000' },
    { token: TOKEN_TYPES.IDENTIFIER, foreground: '001080' }
  ],
  colors: {
    'editor.foreground': '#000000',
    'editor.background': '#FFFFFF',
    'editor.lineHighlightBackground': '#FFFFFF',
    'editorCursor.foreground': '#000000',
    'editor.selectionBackground': '#ADD6FF'
  }
};
