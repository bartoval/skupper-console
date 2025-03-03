import type * as monaco from 'monaco-editor'; // Importa solo il tipo

import { TOKEN_TYPES } from '../PromqlBuilder.constants';
import { PROMETHEUS_DICTIONARY } from './Dictionary';

/**
 * Creates a regex that matches whole words followed by an opening parenthesis
 */
const createRegExp = (arr: string[]): RegExp => new RegExp(`\\b(${arr.join('|')})\\b(?=\\s*\\()`);

const escapeRegexSpecialChars = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * This function takes an array of strings and constructs a regex that matches
 * any of those strings as a whole word, followed by an opening parenthesis.
 *
 * Example:
 *   createRegExp(['sum', 'avg'])  // Creates the regex /\b(sum|avg)\b(?=\s*\()/
 *   This regex would match "sum(" or "avg(" but not "summary(" or "average(".
 */
export const monarchTokensProvider: monaco.languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.promql',
  symbols: /[=><!~?:&|+\-*^%]+/,

  tokenizer: {
    root: [
      // Aggregator functions
      [createRegExp(PROMETHEUS_DICTIONARY.operators.aggregation.operators), TOKEN_TYPES.AGGREGATOR],

      // PromQL functions
      [createRegExp(PROMETHEUS_DICTIONARY.getAllFunctions()), TOKEN_TYPES.FUNCTION],

      // Keywords (all types of operators)
      [
        new RegExp(
          `\\b(${[
            // Grouping operators
            ...PROMETHEUS_DICTIONARY.operators.grouping.operators,

            // Binary operators
            ...PROMETHEUS_DICTIONARY.comparators.arithmetic.map(escapeRegexSpecialChars),
            ...PROMETHEUS_DICTIONARY.comparators.equality.map(escapeRegexSpecialChars),
            ...PROMETHEUS_DICTIONARY.comparators.ordering.map(escapeRegexSpecialChars),
            ...PROMETHEUS_DICTIONARY.comparators.matching.map(escapeRegexSpecialChars),

            // Modifiers
            PROMETHEUS_DICTIONARY.operators.modifiers.offset.operator,
            PROMETHEUS_DICTIONARY.operators.modifiers.bool.operator,
            PROMETHEUS_DICTIONARY.operators.modifiers.at.operator,

            // Vector matching
            'group_left',
            'group_right'
          ]
            .filter(Boolean)
            .join('|')})\\b`
        ),
        TOKEN_TYPES.KEYWORD
      ],

      // Vector matching modifiers with optional label lists
      [/\b(group_(?:left|right))(?:\s*\([^)]*\)|\s+|$)/, TOKEN_TYPES.KEYWORD],

      // Subquery syntax [duration:duration]
      [/\[\d+[smhdwy]:\d+[smhdwy]\]/, TOKEN_TYPES.KEYWORD],

      // Time ranges [duration]
      [/\[\d+[smhdwy]\]/, TOKEN_TYPES.KEYWORD],

      // Offset duration
      [/\b(offset\s+\d+[smhdwy])/, TOKEN_TYPES.KEYWORD],

      // @ timestamp
      [/@\d+(\.\d+)?/, TOKEN_TYPES.KEYWORD],

      // Metrics (starting with skupper_)
      [/\b(skupper_[a-zA-Z_][a-zA-Z0-9_]*)\b/, TOKEN_TYPES.METRIC],

      // Labels in different contexts
      [/[a-zA-Z_][a-zA-Z0-9_]*(?=\s*[=!<>~])/, TOKEN_TYPES.LABEL],
      [/[a-zA-Z_][a-zA-Z0-9_]*(?=\s*\})/, TOKEN_TYPES.LABEL],
      [/[a-zA-Z_][a-zA-Z0-9_]*(?=\s*,)/, TOKEN_TYPES.LABEL],

      // Numbers
      [/\b\d*\.\d+\b/, TOKEN_TYPES.NUMBER], // Floating point
      [/\b\d+\b/, TOKEN_TYPES.NUMBER], // Integers
      [/\b\d+(\.\d+)?([eE][+-]?\d+)?\b/, TOKEN_TYPES.NUMBER], // Scientific notation

      // Strings
      [/"/, { token: TOKEN_TYPES.STRING, next: '@string_double' }],
      [/'/, { token: TOKEN_TYPES.STRING, next: '@string_single' }],

      // Comparison operators
      [/==|!=|>=|<=|=~|!~|>|</, TOKEN_TYPES.OPERATOR],

      // Arithmetic operators
      [/[+\-*/%^]/, TOKEN_TYPES.OPERATOR],

      // Logical operators
      [/\b(and|or|unless)\b/, TOKEN_TYPES.OPERATOR],

      // Delimiters
      [/[{}()[\]]/, TOKEN_TYPES.DELIMITER],
      [/,/, TOKEN_TYPES.DELIMITER],

      // Identifiers (catch-all)
      [/[a-zA-Z_]\w*/, TOKEN_TYPES.IDENTIFIER]
    ],

    string_double: [
      [/[^"\\]+/, TOKEN_TYPES.STRING],
      [/\\./, TOKEN_TYPES.STRING],
      [/"/, { token: TOKEN_TYPES.STRING, next: '@pop' }]
    ],

    string_single: [
      [/[^'\\]+/, TOKEN_TYPES.STRING],
      [/\\./, TOKEN_TYPES.STRING],
      [/'/, { token: TOKEN_TYPES.STRING, next: '@pop' }]
    ]
  }
};
