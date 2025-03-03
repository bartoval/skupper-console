import { languages } from 'monaco-editor';
import type { IRange } from 'monaco-editor';

import { TokenAnalysis } from '../../../../../types/PromBuilder.interfaces';
import { createSuggestion } from '../../../utils/completition';
import { PROMETHEUS_DICTIONARY } from '../../Dictionary';

/**
 * Provides completion items for binary operators in PromQL.
 *
 * The suggestions are determined as follows:
 *   - If the context is 'binary-operator':
 *     Provides a list of binary operators (+, -, *, /, %, ^) from PROMETHEUS_DICTIONARY.operators.binary.operators.
 *   - Otherwise: returns an empty array of suggestions.
 */

export interface BinaryOperatorSuggestionsProps {
  range: IRange;
  tokenType: TokenAnalysis;
}

export const getBinaryOperatorSuggestions = ({
  range,
  tokenType
}: BinaryOperatorSuggestionsProps): languages.CompletionItem[] => {
  if (tokenType.type !== 'binary-operator') {
    return [];
  }

  let operators: string[] = [];
  let detail = 'Binary Operator';

  // Select operators based on subType if available
  switch (tokenType.subType) {
    case 'arithmetic':
      operators = PROMETHEUS_DICTIONARY.operators.binary.arithmetic.operators;
      detail = 'Arithmetic Operator';
      break;
    case 'comparison':
      operators = PROMETHEUS_DICTIONARY.operators.binary.comparison.operators;
      detail = 'Comparison Operator';
      break;
    case 'set':
      operators = PROMETHEUS_DICTIONARY.operators.binary.set.operators;
      detail = 'Set Operator';
      break;
    default:
      // If no subType, show all binary operators
      operators = [
        ...PROMETHEUS_DICTIONARY.operators.binary.arithmetic.operators,
        ...PROMETHEUS_DICTIONARY.operators.binary.comparison.operators,
        ...PROMETHEUS_DICTIONARY.operators.binary.set.operators
      ];
  }

  return operators.map((operator) =>
    createSuggestion({
      label: operator,
      kind: languages.CompletionItemKind.Keyword,
      insertText: `${operator} `,
      insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range,
      detail,
      documentation: {
        value: `Use ${operator} for ${tokenType.subType || 'binary'} operations`
      }
    })
  );
};
