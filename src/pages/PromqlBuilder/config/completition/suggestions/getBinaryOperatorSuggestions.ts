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
  let suggestions: languages.CompletionItem[] = [];

  if (tokenType.type === 'binary-operator') {
    suggestions = PROMETHEUS_DICTIONARY.operators.binary.operators.map((operator) =>
      createSuggestion({
        label: operator,
        kind: languages.CompletionItemKind.Keyword,
        insertText: `${operator} `,
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range,
        detail: 'Binary Operator',
        documentation: {
          value: `Use ${operator} for binary operations`
        }
      })
    );
  }

  return suggestions;
};
