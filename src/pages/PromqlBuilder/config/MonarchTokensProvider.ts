import * as monaco from 'monaco-editor';

import { TOKEN_TYPES } from '../PromqlBuilder.constants';
import { PROMETHEUS_DICTIONARY } from './Dictionary';

export const monarchTokensProvider: monaco.languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.promql',

  keywords: [
    ...PROMETHEUS_DICTIONARY.operators.grouping.operators,
    ...PROMETHEUS_DICTIONARY.operators.binary.operators,
    PROMETHEUS_DICTIONARY.operators.modifiers.offset.operator,
    PROMETHEUS_DICTIONARY.operators.modifiers.bool.operator
  ],

  operators: [...PROMETHEUS_DICTIONARY.getAllComparators()],

  symbols: /[=><!~?:&|+\-*^%]+/,

  tokenizer: {
    root: [
      // Aggregator functions
      [
        new RegExp(`\\b(${PROMETHEUS_DICTIONARY.operators.aggregation.operators.join('|')})\\b(?=\\s*\\()`),
        TOKEN_TYPES.AGGREGATOR
      ],

      // PromQL functions
      [new RegExp(`\\b(${PROMETHEUS_DICTIONARY.getAllFunctions().join('|')})\\b(?=\\s*\\()`), TOKEN_TYPES.FUNCTION],

      // Keywords (grouping operators, binary operators, and modifiers)
      [
        new RegExp(
          `\\b(${[
            ...PROMETHEUS_DICTIONARY.operators.grouping.operators,
            ...PROMETHEUS_DICTIONARY.operators.binary.operators,
            PROMETHEUS_DICTIONARY.operators.modifiers.offset.operator,
            PROMETHEUS_DICTIONARY.operators.modifiers.bool.operator
          ].join('|')})\\b`
        ),
        TOKEN_TYPES.KEYWORD
      ],

      // Metrics (starting with skupper_)
      [/\b(skupper_[a-zA-Z_][a-zA-Z0-9_]*)\b/, TOKEN_TYPES.METRIC],

      // Labels con vari contesti
      [/[a-zA-Z_][a-zA-Z0-9_]*(?=\s*[=!<>~])/, TOKEN_TYPES.LABEL],
      [/[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\})/, TOKEN_TYPES.LABEL],
      [/[a-zA-Z_][a-zA-Z0-9_]*(?=\s*,)/, TOKEN_TYPES.LABEL],

      // Numbers including scientific notation
      [/\b\d+(\.\d+)?([eE][+-]?\d+)?\b/, TOKEN_TYPES.NUMBER],

      // Strings
      [/"/, { token: TOKEN_TYPES.STRING, next: '@string_double' }],
      [/'/, { token: TOKEN_TYPES.STRING, next: '@string_single' }],

      // Operators
      [/[=<>!]=?/, TOKEN_TYPES.OPERATOR],
      [/=~|!~/, TOKEN_TYPES.OPERATOR],
      [/[+\-*/%]/, TOKEN_TYPES.OPERATOR],

      // Delimiters
      [/[{}()[\]]/, TOKEN_TYPES.DELIMITER],

      // Identifiers
      [/[a-zA-Z_]\w*/, TOKEN_TYPES.IDENTIFIER]
    ],

    string_double: [
      [/[^\\"]+/, TOKEN_TYPES.STRING],
      [/"/, { token: TOKEN_TYPES.STRING, next: '@pop' }],
      [/\\./, TOKEN_TYPES.STRING]
    ],

    string_single: [
      [/[^\\']+/, TOKEN_TYPES.STRING],
      [/'/, { token: TOKEN_TYPES.STRING, next: '@pop' }],
      [/\\./, TOKEN_TYPES.STRING]
    ]
  }
};
