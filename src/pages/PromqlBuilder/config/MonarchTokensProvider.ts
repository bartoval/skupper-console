import type * as monaco from 'monaco-editor'; // Importa solo il tipo

import { TOKEN_TYPES } from '../PromqlBuilder.constants';
import { PROMETHEUS_DICTIONARY } from './Dictionary';

/**
 * This function takes an array of strings and constructs a regex that matches
 * any of those strings as a whole word, followed by an opening parenthesis.
 *
 * Example:
 *   createRegExp(['sum', 'avg'])  // Creates the regex /\b(sum|avg)\b(?=\s*\()/
 *   This regex would match "sum(" or "avg(" but not "summary(" or "average(".
 */
const createRegExp = (arr: string[]): RegExp => new RegExp(`\\b(${arr.join('|')})\\b(?=\\s*\\()`);

export const monarchTokensProvider: monaco.languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.promql',
  /**
   * Matches common symbols used in PromQL, such as operators and delimiters.
   * This regex matches '=', '>', '<', '!', '~', ':', '&', '|', '+', '-', '*', '^', '%'.
   */
  symbols: /[=><!~?:&|+\-*^%]+/,

  tokenizer: {
    root: [
      // Aggregator functions
      [createRegExp(PROMETHEUS_DICTIONARY.operators.aggregation.operators), TOKEN_TYPES.AGGREGATOR],

      // PromQL functions
      [createRegExp(PROMETHEUS_DICTIONARY.getAllFunctions()), TOKEN_TYPES.FUNCTION],

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
