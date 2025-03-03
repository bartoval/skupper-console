import type { editor } from 'monaco-editor';

import { TOKEN_TYPES } from '../PromqlBuilder.constants';

// Color palette based on VS Code's default theme but with enhanced contrast
const colors = {
  blue: '0000FF', // Pure blue for keywords
  darkBlue: '000080', // Navy for special keywords
  purple: '9400D3', // Purple for aggregators
  brown: '795E26', // Brown for functions
  teal: '008B8B', // Teal for metrics
  darkCyan: '0E7490', // Dark cyan for labels
  green: '008000', // Green for strings
  darkGreen: '098658', // Dark green for numbers
  red: 'CF222E', // Red for important operators
  gray: '666666', // Gray for delimiters
  black: '000000', // Black for general text
  orange: 'D4500C' // Orange for time-related tokens
} as const;

export const editorTheme: editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [
    // Aggregation and Functions
    { token: TOKEN_TYPES.AGGREGATOR, foreground: colors.purple, fontStyle: 'bold' },
    { token: TOKEN_TYPES.FUNCTION, foreground: colors.brown, fontStyle: 'bold' },

    // Keywords and Operators
    { token: TOKEN_TYPES.KEYWORD, foreground: colors.blue, fontStyle: 'bold' },
    { token: `${TOKEN_TYPES.KEYWORD}.modifier`, foreground: colors.darkBlue, fontStyle: 'bold' }, // offset, bool, @
    { token: `${TOKEN_TYPES.KEYWORD}.time`, foreground: colors.orange }, // Time-related keywords
    { token: TOKEN_TYPES.OPERATOR, foreground: colors.red, fontStyle: 'bold' },
    { token: `${TOKEN_TYPES.OPERATOR}.comparison`, foreground: colors.red, fontStyle: 'bold' }, // ==, !=, >, <
    { token: `${TOKEN_TYPES.OPERATOR}.arithmetic`, foreground: colors.red }, // +, -, *, /
    { token: `${TOKEN_TYPES.OPERATOR}.logical`, foreground: colors.blue, fontStyle: 'bold' }, // and, or, unless

    // Metrics and Labels
    { token: TOKEN_TYPES.METRIC, foreground: colors.teal },
    { token: TOKEN_TYPES.LABEL, foreground: colors.darkCyan },
    { token: `${TOKEN_TYPES.LABEL}.matcher`, foreground: colors.darkCyan, fontStyle: 'bold' }, // Label in matcher context

    // Values
    { token: TOKEN_TYPES.NUMBER, foreground: colors.darkGreen },
    { token: TOKEN_TYPES.STRING, foreground: colors.green },

    // Structure
    { token: TOKEN_TYPES.DELIMITER, foreground: colors.gray },
    { token: `${TOKEN_TYPES.DELIMITER}.brackets`, foreground: colors.gray, fontStyle: 'bold' }, // [], {}
    { token: TOKEN_TYPES.IDENTIFIER, foreground: colors.black },

    // Special contexts
    { token: 'subquery', foreground: colors.orange, fontStyle: 'bold' }, // Subquery syntax
    { token: 'duration', foreground: colors.orange }, // Duration literals
    { token: 'timestamp', foreground: colors.orange } // Timestamp literals
  ],
  colors: {
    // Basic editor colors
    'editor.foreground': '#000000',
    'editor.background': '#FFFFFF',
    'editor.lineHighlightBackground': '#F5F5F5', // Slightly visible line highlight
    'editorCursor.foreground': '#000000',
    'editor.selectionBackground': '#ADD6FF',

    // Additional editor styling
    'editor.selectionHighlightBackground': '#E3F2FD',
    'editor.wordHighlightBackground': '#E8E8E8',
    'editor.wordHighlightStrongBackground': '#E0E0E0',
    'editorLineNumber.foreground': '#999999',
    'editorLineNumber.activeForeground': '#666666',
    'editorIndentGuide.background': '#EEEEEE',
    'editorIndentGuide.activeBackground': '#DDDDDD',
    'editorBracketMatch.background': '#E0E0E0',
    'editorBracketMatch.border': '#808080'
  }
};
